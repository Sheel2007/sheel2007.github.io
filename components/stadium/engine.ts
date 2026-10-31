import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { Athlete, CONTACT, loadAssets, type Assets, type Kit, type Look } from "./athlete"
import { BALL_R, GOAL_H, GOAL_HALF, HALF_L, HALF_W, ball as makeBall, buildWorld, netDepth } from "./world"

export type SquadMember = { slug: string; number: number; shirt: string; spot: [number, number]; keeper?: boolean }
export type Outcome = "goal" | "saved" | "wide" | "blocked"
// intro: nothing touched yet; build: the move is on; scored: the move ended in a goal; free: play on
export type Phase = "intro" | "build" | "scored" | "free"
export type EngineEvents = {
  select(slug: string | null): void
  busy(on: boolean): void
  result(kind: Outcome, slug: string): void
  phase(p: Phase): void
  aim(on: boolean): void
  progress(touched: string[], next: string | null): void
}
export type EngineOptions = {
  mount: HTMLElement
  squad: SquadMember[]
  tags: Map<string, HTMLElement>
  fade: HTMLElement
  coach?: HTMLElement
  family: string
  reduceMotion: boolean
  on: EngineEvents
}

const HOME: Kit = { shirt: "#c8102e", trim: "#f4efe6", shorts: "#f4efe6", socks: "#c8102e", band: "#f4efe6", print: "#fbf8f2" }
const HOME_GK: Kit = {
  shirt: "#e8bf1c", trim: "#16150f", shorts: "#16150f", socks: "#e8bf1c", band: "#16150f", print: "#16150f",
  longSleeves: true, gloves: "#f4f4f0",
}
const AWAY: Kit = { shirt: "#1d3b6a", trim: "#9cc3ec", shorts: "#1d3b6a", socks: "#1d3b6a", band: "#9cc3ec", print: "#eef4fb" }
const AWAY_GK: Kit = {
  shirt: "#3aa38f", trim: "#0c2a24", shorts: "#0c2a24", socks: "#3aa38f", band: "#0c2a24", print: "#0c2a24",
  longSleeves: true, gloves: "#d8f25a",
}
const LOOKS: Look[] = [
  { skin: "dark", tint: "#ffffff", hair: "Hair_Buzzed", hairColor: "#1a120c", boots: "#f2f2ee" },
  { skin: "light", tint: "#ffffff", hair: "Hair_SimpleParted", hairColor: "#5a3a22", boots: "#141414" },
  { skin: "dark", tint: "#8a6a58", hair: "Hair_Buzzed", beard: true, hairColor: "#0d0a08", boots: "#ff6a2b" },
  { skin: "light", tint: "#d6a585", hair: "Hair_SimpleParted", hairColor: "#1d1410", boots: "#141414" },
  { skin: "light", tint: "#ffffff", hair: "Hair_Buzzed", hairColor: "#a87a43", boots: "#e7f24a" },
  { skin: "dark", tint: "#c4a08a", hair: null, beard: true, hairColor: "#100c0a", boots: "#f2f2ee" },
  { skin: "light", tint: "#e4b796", hair: "Hair_SimpleParted", beard: true, hairColor: "#2b1d14", boots: "#2b6bff" },
  { skin: "dark", tint: "#a07e6a", hair: "Hair_SimpleParted", hairColor: "#0e0b09", boots: "#141414" },
]

const SCALE = 1.05
const GOAL_CENTER = new THREE.Vector3(HALF_L, 0, 0)
const UP = new THREE.Vector3(0, 1, 0)
const yawTo = (from: THREE.Vector3, to: THREE.Vector3) => Math.atan2(to.x - from.x, to.z - from.z)
const rand = (a: number, b: number) => a + Math.random() * (b - a)

type Mover = { a: Athlete; dest: THREE.Vector3; max: number }
type Flight = {
  kind: "pass" | "shot"
  p0: THREE.Vector3
  p1: THREE.Vector3
  t: number
  T: number
  h: number
  curve: number
  lofted: boolean
  to: number
  outcome?: Outcome
  trapped?: boolean
}

export class Engine {
  static async create(opts: EngineOptions) {
    const assets = await loadAssets()
    return new Engine(opts, assets)
  }

  private renderer: THREE.WebGLRenderer
  private composer: EffectComposer | null = null
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(30, 1, 0.3, 900)
  private world: ReturnType<typeof buildWorld>
  private ball: THREE.Mesh
  private home: Mover[]
  private away: Mover[]
  private keeper: Athlete
  private keeperHome = new THREE.Vector3(HALF_L - 0.9, 0, 0)
  private opts: EngineOptions
  private lite: boolean

  private phase: Phase = "intro"
  private touched = new Set<number>()
  private gk: number
  private holder: number
  private selected = -1
  private locked = false
  private queued = -1
  private shooting = false
  private flight: Flight | null = null
  private free = false
  private inNet = false
  private vel = new THREE.Vector3()
  private dribble: { who: number; dest: THREE.Vector3 } | null = null
  // during a shot: [presser, cover, side the presser leans to]
  private roles: [number, number, number] | null = null
  private aiming = -1
  private reticle = new THREE.Group()
  private dive: { t: number; dur: number; from: number; to: number; roll: number; air: number } | null = null
  private timers: { at: number; fn: () => void }[] = []
  private time = 0
  private exciteUntil = 0
  private excite = 0
  private shake = 0

  private mode: "wide" | "play" | "follow" | "aim" = "wide"
  private camPos = new THREE.Vector3()
  private camLook = new THREE.Vector3()
  private wantPos = new THREE.Vector3()
  private wantLook = new THREE.Vector3()
  private focus = new THREE.Vector3()
  private span = new THREE.Vector3()
  private born = performance.now()
  private offset = new THREE.Vector2()
  private wantOffset = new THREE.Vector2()
  private panel: "side" | "bottom" | null = null
  private shadowHalf = 62
  private size = { w: 1, h: 1 }
  private parallax = new THREE.Vector2()
  private hovered = -1
  private visible = true
  private raf = 0
  private clock = new THREE.Clock()
  private cleanups: (() => void)[] = []
  private tmp = new THREE.Vector3()
  private tmp2 = new THREE.Vector3()
  private lastBall = new THREE.Vector3()

  private constructor(opts: EngineOptions, assets: Assets) {
    this.opts = opts
    const { mount, squad, family } = opts
    this.lite = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches || (navigator.hardwareConcurrency ?? 8) <= 4

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    this.renderer = renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.lite ? 1.5 : 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.domElement.setAttribute("aria-hidden", "true")
    mount.appendChild(renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.35
    pmrem.dispose()
    this.scene.fog = new THREE.Fog(0x0a0d12, 150, 430)

    this.world = buildWorld(this.scene, family, this.lite)
    this.ball = makeBall()
    this.scene.add(this.ball)
    // aiming reticle on the goal mouth
    const retMat = new THREE.MeshBasicMaterial({ color: 0xfbf8f2, depthTest: false, transparent: true, opacity: 0.95 })
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.34, 40), retMat)
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.06, 16), retMat)
    this.reticle.add(ring, dot)
    this.reticle.rotation.y = -Math.PI / 2
    this.reticle.renderOrder = 10
    ring.renderOrder = dot.renderOrder = 10
    this.reticle.visible = false
    this.scene.add(this.reticle)

    const make = (kit: Kit, look: Look, name: string, num: number, keeper: boolean, x: number, z: number, yaw: number) => {
      const a = new Athlete(assets, kit, look, name, num, family, keeper)
      a.root.scale.setScalar(SCALE)
      a.root.position.set(x, 0, z)
      a.yaw = a.targetYaw = yaw
      this.scene.add(a.root)
      return a
    }
    this.home = squad.map((m, i) => {
      const a = make(m.keeper ? HOME_GK : HOME, LOOKS[i % LOOKS.length], m.shirt, m.number, !!m.keeper, m.spot[0], m.spot[1], Math.PI / 2)
      return { a, dest: a.root.position.clone(), max: 6 }
    })
    this.away = [-15, -5, 5, 15, -7, 7].map((z, i) => {
      const a = make(AWAY, LOOKS[(i + 3) % LOOKS.length], "VISITORS", i + 2, false, i < 4 ? 30 : 18, z, -Math.PI / 2)
      return { a, dest: a.root.position.clone(), max: 5.5 }
    })
    this.keeper = make(AWAY_GK, LOOKS[7], "VISITORS", 1, true, this.keeperHome.x, 0, -Math.PI / 2)

    this.gk = Math.max(0, squad.findIndex((m) => m.keeper))
    this.holder = this.gk
    this.touched.add(this.gk)
    this.home[this.gk].a.feet(this.ball.position).setY(BALL_R)
    this.focus.copy(this.ball.position)

    if (!this.lite) {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
      this.composer = new EffectComposer(renderer, rt)
      this.composer.addPass(new RenderPass(this.scene, this.camera))
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.5, 1.8))
      this.composer.addPass(new OutputPass())
    }

    this.layout()
    this.offset.copy(this.wantOffset)
    // settle the framing before the first frame so the opening shot doesn't zoom in from nowhere
    this.updateCamera(0)
    this.camPos.copy(this.wantPos)
    this.camLook.copy(this.wantLook)
    this.updateCamera(0)
    const ro = new ResizeObserver(() => this.layout())
    ro.observe(mount)
    const io = new IntersectionObserver(([e]) => (this.visible = e.isIntersecting))
    io.observe(mount)
    this.cleanups.push(() => ro.disconnect(), () => io.disconnect())
    this.bindPointer()
    this.emitProgress()
    this.tick()
  }

  // ---------- public API ----------

  // The suggested next receiver: the furthest-back teammate who hasn't had the ball yet.
  get next() {
    if (this.phase === "scored" || this.phase === "free") return -1
    let best = -1
    this.opts.squad.forEach((m, i) => {
      if (this.touched.has(i) || i === this.flight?.to) return
      if (best < 0 || m.spot[0] < this.opts.squad[best].spot[0]) best = i
    })
    return best
  }

  kickoff() {
    const n = this.next
    if (n >= 0) this.select(this.opts.squad[n].slug)
  }

  select(slug: string) {
    const i = this.opts.squad.findIndex((m) => m.slug === slug)
    if (i < 0 || this.shooting || this.phase === "scored") return
    this.selected = i
    this.opts.on.select(slug)
    if (this.phase === "intro") this.setPhase("build")
    this.mode = "play"
    if (i !== this.holder) this.pass(i)
  }

  deselect() {
    if (this.shooting) return
    this.selected = -1
    this.opts.on.select(null)
  }

  setPanel(panel: "side" | "bottom" | null) {
    this.panel = panel
    const portrait = this.size.w / this.size.h < 0.9
    if (!panel) this.wantOffset.set(0, this.mode === "wide" ? (portrait ? -0.14 : -0.11) : portrait ? 0.06 : 0)
    else if (panel === "bottom") this.wantOffset.set(0, 0.24)
    else this.wantOffset.set(Math.min(0.2, 230 / this.size.w), 0)
  }

  // Shooting opens once every teammate has had the ball (or any time after the first goal).
  get canShoot() {
    return this.phase === "free" || (this.phase === "build" && this.next < 0)
  }

  shoot() {
    if (this.locked || this.shooting || this.holder < 0 || !this.canShoot) return
    this.startShot(this.holder)
  }

  // Keyboard and screen-reader aiming: col -1 left, 0 middle, 1 right (as the shooter sees it); row 0 low, 1 high.
  aimAt(col: number, row: number) {
    this.shootAt(new THREE.Vector3(HALF_L, row ? 2.05 : 0.35, col * 3.05))
  }

  // Place the shot at a point on the goal line (from a click or tap while aiming).
  shootAt(target: THREE.Vector3) {
    if (this.aiming < 0) return
    const i = this.aiming
    this.aiming = -1
    this.reticle.visible = false
    this.opts.on.aim(false)
    this.mode = "follow"
    const p = this.home[i].a
    p.targetYaw = yawTo(p.root.position, target)
    const aim = target.clone()
    this.later(0.12, () => {
      p.kick()
      this.later(CONTACT, () => this.launchShot(i, aim))
    })
  }

  replay() {
    if (this.shooting) return
    this.opts.fade.style.opacity = "1"
    this.later(0.38, () => {
      this.touched = new Set([this.gk])
      this.home.forEach((m, i) => {
        const s = this.opts.squad[i].spot
        m.a.root.position.set(s[0], 0, s[1])
        m.dest.copy(m.a.root.position)
        m.a.yaw = m.a.targetYaw = Math.PI / 2
        m.a.celebrate(0)
      })
      this.resetAway()
      this.holder = this.gk
      this.flight = null
      this.free = this.inNet = false
      this.queued = -1
      this.locked = false
      this.home[this.gk].a.feet(this.ball.position).setY(BALL_R)
      this.selected = -1
      this.opts.on.select(null)
      this.mode = "wide"
      this.setPhase("intro")
      this.setPanel(this.panel)
      this.snapCamera()
      this.opts.fade.style.opacity = "0"
      this.emitProgress()
    })
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.cleanups.forEach((f) => f())
    for (const m of [...this.home, ...this.away]) m.a.dispose()
    this.keeper.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!(m as THREE.SkinnedMesh).isSkinnedMesh) m.geometry?.dispose()
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
      for (const mat of mats) {
        const s = mat as THREE.MeshStandardMaterial
        if (!(m as THREE.SkinnedMesh).isSkinnedMesh) {
          s.map?.dispose()
          s.alphaMap?.dispose()
        }
        mat.dispose()
      }
    })
    this.scene.environment?.dispose()
    this.composer?.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }

  // ---------- the move ----------

  private setPhase(p: Phase) {
    this.phase = p
    this.opts.on.phase(p)
  }

  private emitProgress() {
    const n = this.next
    this.opts.on.progress([...this.touched].map((i) => this.opts.squad[i].slug), n >= 0 ? this.opts.squad[n].slug : null)
  }

  private later(delay: number, fn: () => void) {
    this.timers.push({ at: this.time + delay, fn })
  }

  // Where everyone should be once `count` players have touched the ball: the team pushes up as the move goes on.
  private shape(count: number) {
    const p = (count - 1) / (this.opts.squad.length - 1)
    const push = 36 * p
    this.home.forEach((m, i) => {
      const s = this.opts.squad[i].spot
      const keeper = this.opts.squad[i].keeper
      m.dest.set(keeper ? s[0] + Math.min(push * 0.35, 12) : Math.min(s[0] + push, 39), 0, s[1] * (keeper ? 1 : 1 - p * 0.15))
    })
    this.trackAway()
  }

  private trackAway() {
    let front = -60
    this.home.forEach((m, i) => {
      if (!this.opts.squad[i].keeper) front = Math.max(front, m.dest.x)
    })
    const ballZ = this.ball.position.z
    const line = THREE.MathUtils.clamp(front + 5, 16, 41)
    this.away.forEach((m, i) => {
      if (i < 4) m.dest.set(line, 0, [-15, -5, 5, 15][i] + ballZ * 0.25)
      else m.dest.set(Math.min(line - 11, 30), 0, (i === 4 ? -7 : 7) + ballZ * 0.4)
    })
  }

  private resetAway() {
    this.away.forEach((m, i) => {
      m.a.root.position.set(i < 4 ? 30 : 18, 0, [-15, -5, 5, 15, -7, 7][i])
      m.dest.copy(m.a.root.position)
      m.a.yaw = m.a.targetYaw = -Math.PI / 2
    })
    this.keeper.root.position.copy(this.keeperHome)
    this.keeper.roll = this.keeper.lift = this.keeper.armsUp = 0
    this.keeper.yaw = this.keeper.targetYaw = -Math.PI / 2
    this.dive = null
  }

  private pass(to: number) {
    const from = this.holder
    if (this.locked || from < 0) {
      this.queued = to
      return
    }
    if (from === to) return
    this.locked = true
    const fresh = this.phase === "build" && !this.touched.has(to)
    if (fresh) {
      this.touched.add(to)
      this.shape(this.touched.size)
    }
    this.emitProgress()
    const a = this.home[from].a, b = this.home[to]
    const meet = b.dest.clone()
    a.targetYaw = yawTo(a.root.position, meet)
    this.later(0.22, () => {
      a.kick()
      this.later(CONTACT, () => {
        const p1 = meet.clone().add(this.tmp.copy(a.root.position).sub(meet).setY(0).normalize().multiplyScalar(0.5))
        p1.y = BALL_R
        const dist = this.ball.position.distanceTo(p1)
        const lofted = dist > 24
        const T = lofted ? 0.7 + dist / 24 : 0.3 + dist / 18
        // the receiver times the run to meet the ball
        const run = b.a.root.position.distanceTo(meet)
        b.max = THREE.MathUtils.clamp(run / T, 2, 8.6)
        this.holder = -1
        this.flight = { kind: "pass", p0: this.ball.position.clone(), p1, t: 0, T, h: lofted ? Math.min(2 + dist * 0.11, 8) : 0, curve: 0, lofted, to }
      })
    })
  }

  // The shooter carries the ball to the edge of the box, then the visitor picks the spot.
  private startShot(i: number) {
    const p = this.home[i].a
    this.shooting = this.locked = true
    this.opts.on.busy(true)
    this.mode = "follow"
    const start = p.root.position
    const spot = new THREE.Vector3(HALF_L - 17, 0, THREE.MathUtils.clamp(start.z * 0.4, -6, 6))
    const dir = this.tmp.copy(spot).sub(start).setY(0)
    const dist = dir.length()
    dir.normalize()
    this.dribble = { who: i, dest: start.clone().addScaledVector(dir, THREE.MathUtils.clamp(dist, 0, 45)) }
    const near = this.away
      .map((m, k) => ({ k, d: k < 4 ? Math.abs(m.a.root.position.z - spot.z) : Infinity }))
      .sort((a, b) => a.d - b.d)
    this.roles = [near[0].k, near[1].k, Math.random() < 0.5 ? -1 : 1]
  }

  private beginAim(i: number) {
    this.aiming = i
    this.mode = "aim"
    const p = this.home[i].a
    p.speed = 0
    p.targetYaw = yawTo(p.root.position, GOAL_CENTER)
    this.opts.on.aim(true)
  }

  private launchShot(shooter: number, aim: THREE.Vector3) {
    const p0 = this.ball.position.clone()
    const dist = p0.distanceTo(GOAL_CENTER)
    // nobody is perfect: a little error that grows with distance
    const err = 0.1 + dist * 0.005
    const p1 = new THREE.Vector3(HALF_L + 0.3, THREE.MathUtils.clamp(aim.y + rand(-err, err), BALL_R, 4.5), aim.z + rand(-err, err))
    const inFrame = Math.abs(p1.z) < GOAL_HALF - BALL_R && p1.y < GOAL_H - BALL_R
    let outcome: Outcome
    if (!inFrame) {
      outcome = "wide"
      p1.x = HALF_L + 0.6
    } else {
      // the keeper covers the middle; tucked into a corner, low or high, beats him
      const dz = Math.abs(p1.z - this.keeper.root.position.z)
      const awkward = p1.y < 0.55 || p1.y > 1.85
      const reach = awkward ? 1.4 : 1.95
      const chance = dz < reach ? 0.9 : dz < reach + 0.75 ? 0.4 : 0.05
      outcome = Math.random() < chance ? "saved" : "goal"
      if (outcome === "saved") p1.x = HALF_L - 0.4
    }
    // anyone standing in the ball's path gets a body on it
    const h = Math.min(dist * 0.012, 0.6)
    let block = 2
    for (const m of this.away) {
      const d = m.a.root.position
      const dx = p1.x - p0.x, dz = p1.z - p0.z
      const len2 = dx * dx + dz * dz
      const s = THREE.MathUtils.clamp(((d.x - p0.x) * dx + (d.z - p0.z) * dz) / len2, 0, 1)
      if (s < 0.05 || s >= block) continue
      const miss = Math.hypot(p0.x + dx * s - d.x, p0.z + dz * s - d.z)
      const y = THREE.MathUtils.lerp(p0.y, p1.y, s) + h * 4 * s * (1 - s)
      if (miss < 0.4 && y < 1.9 * SCALE) block = s
    }
    if (block < 2) {
      outcome = "blocked"
      p1.lerpVectors(p0, p1, block)
    }
    const T = Math.max(0.45, dist / 28) * Math.min(1, block)
    this.flight = { kind: "shot", p0, p1, t: 0, T: Math.max(0.2, T), h: h * Math.min(1, block), curve: 0, lofted: true, to: shooter, outcome }
    this.holder = -1
    if (outcome !== "blocked") this.later(0.1, () => this.diveFor(p1, T - 0.1, outcome))
  }

  private diveFor(target: THREE.Vector3, dur: number, outcome: Outcome) {
    const k = this.keeper.root.position
    let dz = target.z - k.z
    let y = target.y
    // beaten: right way, not far enough
    if (outcome === "goal") dz *= 0.5
    if (outcome === "wide") {
      dz *= 0.35
      y = Math.min(y, 1.4)
    }
    const reach = 2.1 * SCALE
    let roll = Math.acos(THREE.MathUtils.clamp((y - 0.2) / reach, 0, 1))
    if (Math.abs(dz) < 0.8) roll = Math.min(roll, 0.35)
    const slide = Math.max(0, Math.abs(dz) - reach * Math.sin(roll))
    // the keeper faces -x, so a dive toward +z is a roll toward the keeper's own left (+x local, negative z rotation)
    this.dive = {
      t: 0,
      dur: THREE.MathUtils.clamp(dur, 0.3, 0.85),
      from: k.z,
      to: k.z + Math.sign(dz) * slide,
      roll: -Math.sign(dz || 1) * roll,
      air: Math.abs(roll) < 0.5 ? Math.max(0, y - 2) + 0.3 : 0.35,
    }
  }

  private result(kind: Outcome, shooter: number) {
    this.opts.on.result(kind, this.opts.squad[shooter].slug)
    if (kind === "goal") {
      this.exciteUntil = this.time + 3.6
      this.shake = 0.5
      this.home.forEach((m, i) => this.later(i === shooter ? 0.15 : rand(0.3, 0.8), () => m.a.celebrate(i === shooter ? 3 : 2.4)))
    } else {
      this.exciteUntil = this.time + (kind === "saved" ? 0.9 : 0.5)
    }
    // the first goal ends the move; a miss just resets so they can try again
    const finale = kind === "goal" && this.phase === "build"
    if (finale) this.setPhase("scored")
    this.later(finale ? 3.4 : 2.6, () => {
      this.opts.fade.style.opacity = "1"
      this.later(0.38, () => this.restart(shooter))
    })
  }

  // After a shot: back to the shape, ball at the shooter's feet, play on.
  private restart(shooter: number) {
    this.shape(this.opts.squad.length)
    this.home.forEach((m) => {
      m.a.root.position.copy(m.dest)
      m.a.celebrate(0)
      m.a.speed = 0
    })
    const s = this.home[shooter].a
    s.yaw = s.targetYaw = Math.PI / 2
    this.away.forEach((m) => m.a.root.position.copy(m.dest))
    this.keeper.root.position.copy(this.keeperHome)
    this.keeper.roll = this.keeper.lift = this.keeper.armsUp = 0
    this.dive = null
    this.roles = null
    this.flight = null
    this.free = this.inNet = false
    this.vel.set(0, 0, 0)
    this.holder = shooter
    s.feet(this.ball.position).setY(BALL_R)
    this.shooting = this.locked = false
    if (this.phase === "scored") this.setPhase("free")
    this.mode = "play"
    this.snapCamera()
    this.opts.fade.style.opacity = "0"
    this.opts.on.busy(false)
    this.emitProgress()
  }

  // ---------- simulation ----------

  private stepBall(dt: number) {
    const b = this.ball.position
    this.lastBall.copy(b)
    const f = this.flight
    if (this.holder >= 0) {
      const dribbling = this.dribble?.who === this.holder
      const runner = this.home[this.holder].a
      const ahead = dribbling || runner.speed > 1 ? 0.65 + Math.abs(Math.sin(this.time * 7)) * 0.2 : 0.45
      runner.feet(this.tmp2, ahead).setY(BALL_R)
      if (this.settle) {
        // first touch: the ball comes off the foot and is pulled back under control
        const st = this.settle
        st.t += dt
        const e = Math.min(1, st.t / 0.35)
        b.lerpVectors(st.from, this.tmp2, e * e * (3 - 2 * e))
        if (e >= 1) this.settle = null
      } else b.copy(this.tmp2)
    } else if (f) {
      f.t += dt
      const s = Math.min(1, f.t / f.T)
      if (f.kind === "pass") {
        // steer the last part of the pass onto the receiver's foot wherever their run has taken them
        const r = this.home[f.to].a
        if (s > 0.55) f.p1.lerp(r.feet(this.tmp, 0.55).setY(BALL_R), Math.min(1, dt * 6))
      }
      const e = f.lofted ? s : 1 - Math.pow(1 - s, 1.6)
      b.lerpVectors(f.p0, f.p1, e)
      if (f.curve) b.addScaledVector(this.tmp.copy(f.p1).sub(f.p0).cross(UP).normalize(), f.curve * 4 * s * (1 - s))
      b.y = THREE.MathUtils.lerp(f.p0.y, f.p1.y, s) + f.h * 4 * s * (1 - s)
      if (f.kind === "pass" && f.T - f.t < 0.16 && !f.trapped) {
        f.trapped = true
        this.home[f.to].a.trap()
      }
      if (s >= 1) this.arrive(f, dt)
    } else if (this.free) {
      const v = this.vel
      v.y -= 9.8 * dt
      b.addScaledVector(v, dt)
      if (this.inNet) {
        const back = HALF_L + netDepth(b.y) - BALL_R
        if (b.x > back) {
          b.x = back
          if (v.x > 0) {
            this.world.goals[1].ripple(b.y, b.z, Math.min(v.x * 0.04, 0.5))
            v.x *= -0.12
            v.y *= 0.5
            v.z *= 0.4
          }
        }
        if (Math.abs(b.z) > GOAL_HALF - BALL_R) {
          b.z = Math.sign(b.z) * (GOAL_HALF - BALL_R)
          v.z *= -0.2
        }
        if (b.y > GOAL_H - BALL_R) {
          b.y = GOAL_H - BALL_R
          v.y *= -0.2
        }
        if (b.x < HALF_L + BALL_R) {
          b.x = HALF_L + BALL_R
          v.x = Math.abs(v.x) * 0.2
        }
      }
      if (b.y < BALL_R) {
        b.y = BALL_R
        v.y = v.y < -1.5 ? -v.y * 0.5 : 0
      }
      if (b.y <= BALL_R + 1e-3) {
        const k = Math.exp(-1.2 * dt)
        v.x *= k
        v.z *= k
      }
      const bx = HALF_L + 4.8, bz = HALF_W + 4.3
      if (Math.abs(b.x) > bx) {
        b.x = Math.sign(b.x) * bx
        v.x *= -0.3
      }
      if (Math.abs(b.z) > bz) {
        b.z = Math.sign(b.z) * bz
        v.z *= -0.3
      }
    }
    const dx = b.x - this.lastBall.x, dz = b.z - this.lastBall.z
    const d = Math.hypot(dx, dz)
    if (d > 1e-5) this.ball.rotateOnWorldAxis(this.tmp2.set(dz, 0, -dx).normalize(), d / BALL_R)
  }

  private arrive(f: Flight, dt: number) {
    this.flight = null
    if (f.kind === "pass") {
      this.holder = f.to
      this.settle = { from: this.ball.position.clone(), t: 0 }
      this.locked = false
      this.home[f.to].max = 6
      this.trackAway()
      this.emitProgress()
      if (this.queued >= 0) {
        const q = this.queued
        this.queued = -1
        if (q !== this.holder) this.pass(q)
      }
      return
    }
    this.vel.copy(this.ball.position).sub(this.lastBall).divideScalar(Math.max(dt, 1e-3))
    this.free = true
    if (f.outcome === "goal") {
      this.inNet = true
      this.vel.multiplyScalar(0.8)
    } else if (f.outcome === "saved") {
      this.vel.set(-rand(5, 10), rand(2, 5), Math.sign(f.p1.z || 1) * rand(3, 8))
    } else if (f.outcome === "blocked") {
      this.vel.set(-rand(4, 9), rand(1.5, 4), rand(-6, 6))
    }
    this.result(f.outcome!, f.to)
  }
  private settle: { from: THREE.Vector3; t: number } | null = null

  private moveTo(m: Mover, dt: number, faceBall: boolean) {
    const a = m.a
    const to = this.tmp.copy(m.dest).sub(a.root.position).setY(0)
    const d = to.length()
    const want = d < 0.15 ? 0 : Math.min(m.max, d * 2.2 + 0.4)
    a.speed += (want - a.speed) * Math.min(1, dt * 4)
    if (a.speed > 0.05 && d > 0.01) {
      a.root.position.addScaledVector(to.normalize(), Math.min(d, a.speed * dt))
      if (a.speed > 1.2) a.targetYaw = Math.atan2(to.x, to.z)
    }
    if (faceBall && a.speed <= 1.2) {
      const bx = this.ball.position.x - a.root.position.x, bz = this.ball.position.z - a.root.position.z
      if (bx * bx + bz * bz > 4) a.targetYaw = Math.atan2(bx, bz)
    }
  }

  private stepPlayers(dt: number) {
    const ballPos = this.ball.position

    if (this.dribble) {
      const dr = this.dribble
      const p = this.home[dr.who]
      const to = this.tmp.copy(dr.dest).sub(p.a.root.position).setY(0)
      const d = to.length()
      if (d < 0.3) {
        p.a.speed = 0
        this.dribble = null
        this.beginAim(dr.who)
      } else {
        p.a.speed = Math.min(8.6, p.a.speed + dt * 14)
        p.a.root.position.addScaledVector(to.normalize(), Math.min(d, p.a.speed * dt))
        p.a.targetYaw = Math.atan2(to.x, to.z)
      }
    }

    this.home.forEach((m, i) => {
      if (this.dribble?.who === i) return
      if (i === this.holder && !this.shooting) {
        // the player on the ball stays put and faces where the next pass could go
        m.dest.copy(m.a.root.position)
        m.a.speed *= Math.exp(-dt * 6)
      } else if (!this.shooting) {
        this.moveTo(m, dt, true)
        const f = this.flight
        if (f?.kind === "pass" && f.to === i) {
          // open up to the ball as it comes in, easing off the run in the last few strides
          const s = f.t / f.T
          if (s > 0.4) m.a.targetYaw = yawTo(m.a.root.position, this.ball.position)
          if (s > 0.75) m.a.speed = Math.min(m.a.speed, 2.2)
        }
      }
      else m.a.speed *= Math.exp(-dt * 3)
    })
    const shooter = this.dribble?.who ?? (this.aiming >= 0 ? this.aiming : -1)
    if (shooter >= 0 && this.roles) {
      // one defender closes the shooter down, one covers a post, the rest hold their width
      const r = this.home[shooter].a.root.position
      const toGoal = this.tmp2.copy(GOAL_CENTER).sub(r).setY(0).normalize()
      const [press, cover] = this.roles
      this.away.forEach((m, i) => {
        if (i === press) {
          // close enough to block a lazy shot, offset so there's still a gap either side
          m.dest.copy(r).addScaledVector(toGoal, 3.6)
          m.dest.x += -toGoal.z * this.roles![2] * 1.3
          m.dest.z += toGoal.x * this.roles![2] * 1.3
        } else if (i === cover) m.dest.set(HALF_L - 6.5, 0, r.z * 0.35 - this.roles![2] * 2.3)
        else if (i < 4) m.dest.set(HALF_L - 9, 0, Math.sign([-15, -5, 5, 15][i]) * (8 + (i % 3)) + r.z * 0.2)
        m.max = i === press ? 6.5 : 5
      })
    }
    this.away.forEach((m) => this.moveTo(m, dt, true))

    for (const m of [...this.home, ...this.away]) m.a.update(dt, this.time, ballPos)

    const k = this.keeper
    if (this.dive) {
      const d = this.dive
      d.t += dt
      const x = Math.min(1, d.t / d.dur)
      const e = 1 - (1 - x) * (1 - x)
      k.root.position.z = THREE.MathUtils.lerp(d.from, d.to, e)
      k.targetYaw = k.yaw = -Math.PI / 2
      k.roll = d.roll * e
      k.lift = Math.sin(Math.PI * Math.min(x * 1.15, 1)) * d.air
      k.armsUp = 1
      k.speed = 0
    } else {
      const wantZ = THREE.MathUtils.clamp(ballPos.z * 0.12, -1.6, 1.6)
      const step = THREE.MathUtils.clamp(wantZ - k.root.position.z, -dt * 2.5, dt * 2.5)
      k.root.position.z += step
      k.speed = Math.abs(step) > dt * 0.5 ? 1.5 : 0
      k.targetYaw = THREE.MathUtils.clamp(yawTo(k.root.position, ballPos), -Math.PI / 2 - 0.9, -Math.PI / 2 + 0.9)
    }
    k.update(dt, this.time, ballPos)
  }

  // ---------- camera ----------

  private layout() {
    const { mount } = this.opts
    const w = Math.max(1, mount.clientWidth), h = Math.max(1, mount.clientHeight)
    this.size = { w, h }
    this.renderer.setSize(w, h)
    this.composer?.setSize(w, h)
    this.composer?.setPixelRatio(this.renderer.getPixelRatio())
    this.camera.aspect = w / h
    this.camera.fov = w / h < 0.9 ? 54 : 30
    this.camera.updateProjectionMatrix()
    this.setPanel(this.panel)
  }

  private snapCamera() {
    this.cameraTarget()
    this.camPos.copy(this.wantPos)
    this.camLook.copy(this.wantLook)
    this.focus.copy(this.ball.position)
  }

  private cameraTarget() {
    const pos = this.wantPos, look = this.wantLook
    const portrait = this.size.w / this.size.h < 0.9
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const aspect = this.size.w / this.size.h
    const f = this.focus
    if (this.mode === "aim" && this.aiming >= 0) {
      // over the shooter's shoulder, goal filling the middle of the screen
      const sp = this.home[this.aiming].a.root.position
      const dir = this.tmp2.copy(GOAL_CENTER).sub(sp).setY(0).normalize()
      const back = portrait ? 3.2 : 5
      pos.copy(sp).addScaledVector(dir, -back).add(this.tmp.set(-dir.z * 0.9, portrait ? 2.6 : 2.2, dir.x * 0.9))
      look.set(HALF_L, 1.1, sp.z * 0.15)
    } else if (this.mode === "follow") {
      const b = this.ball.position
      const anchor = this.tmp.copy(b)
      anchor.x = Math.min(anchor.x, HALF_L - 15)
      const dir = this.tmp2.copy(GOAL_CENTER).sub(anchor).setY(0).normalize()
      if (portrait) pos.copy(anchor).addScaledVector(dir, -12).add(this.tmp.set(0, 6, 0))
      else pos.copy(anchor).addScaledVector(dir, -11).add(this.tmp.set(-dir.z * 5, 4.6, dir.x * 5))
      look.copy(b).lerp(GOAL_CENTER, 0.55)
      look.y = 1
    } else if (this.mode === "play" || portrait) {
      // frame the ball and whoever should get it next, so the next pass is always on screen
      const sp = this.span
      if (portrait) {
        const usable = this.panel === "bottom" ? 0.72 : 1
        const halfZ = sp.y / 2 + 6
        const halfX = sp.x / 2 + 7
        const dist = Math.max(34, halfZ / (t * aspect), (halfX * 1.25) / (t * usable))
        look.set(f.x + 3, 0, f.z)
        pos.copy(look).addScaledVector(this.tmp.set(-0.76, 0.65, 0).normalize(), dist)
        // stay in front of the end stand; climb instead of backing into it
        if (pos.x < -57) {
          pos.y += (-57 - pos.x) * 0.9
          pos.x = -57
        }
      } else {
        const usable = this.panel === "side" ? 1 - Math.min(0.45, 450 / this.size.w) : 1
        const halfX = sp.x / 2 + 10
        const halfZ = sp.y / 2 + 7
        const dist = Math.max(46, halfX / (t * aspect * usable), halfZ / (1.5 * t))
        look.set(f.x, 0, f.z - 1)
        pos.copy(look).addScaledVector(this.tmp.set(0, 0.5, 0.866), dist)
      }
    } else {
      look.set(-14, 0, -2)
      const dist = Math.max(45 / (t * aspect), 100)
      pos.copy(look).addScaledVector(this.tmp.set(0, 0.52, 0.855).normalize(), dist)
      pos.x += this.parallax.x * 4
      pos.y -= this.parallax.y * 3
    }
  }

  private updateCamera(dt: number) {
    const rm = this.opts.reduceMotion
    // the camera follows a smoothed focus point so passes read as a pan, not a jerk
    const b = this.ball.position
    const target = this.flight?.kind === "pass" ? this.flight.to : this.next
    let minX = b.x, maxX = b.x, minZ = b.z, maxZ = b.z
    if (target >= 0 && (this.mode === "play" || this.size.w / this.size.h < 0.9)) {
      const m = this.home[target]
      for (const p of [m.a.root.position, m.dest]) {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minZ = Math.min(minZ, p.z)
        maxZ = Math.max(maxZ, p.z)
      }
    }
    const k0 = rm || dt === 0 ? 1 : 1 - Math.exp(-dt * 1.8)
    this.focus.lerp(this.tmp.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2), k0)
    this.span.lerp(this.tmp2.set(maxX - minX, 0, 0).setY(maxZ - minZ), k0)
    this.cameraTarget()
    const k = rm ? 1 : 1 - Math.exp(-dt * (this.mode === "follow" ? 4 : 2.2))
    this.camPos.lerp(this.wantPos, k)
    this.camLook.lerp(this.wantLook, k)
    this.camera.position.copy(this.camPos)
    if (this.shake > 0 && !rm) {
      this.shake = Math.max(0, this.shake - dt)
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.5
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.5
    }
    this.camera.lookAt(this.camLook)
    this.setPanel(this.panel)
    this.offset.lerp(this.wantOffset, rm ? 1 : 1 - Math.exp(-dt * 5))
    const { w, h } = this.size
    this.camera.setViewOffset(w, h, this.offset.x * w, this.offset.y * h, w, h)

    const key = this.world.key
    const want = this.mode === "wide" ? 64 : 34
    this.shadowHalf += (want - this.shadowHalf) * Math.min(1, dt * 3)
    const c = this.mode === "wide" ? this.tmp.set(0, 0, 0) : this.tmp.copy(this.camLook).setY(0)
    key.target.position.copy(c)
    key.position.copy(c).add(this.tmp2.set(-40, 75, 45))
    const cam = key.shadow.camera
    cam.left = cam.bottom = -this.shadowHalf
    cam.right = cam.top = this.shadowHalf
    cam.updateProjectionMatrix()
  }

  // Coach mark: dim the stadium and light up who to act on. On a first visit that's the first pass;
  // once every teammate has had the ball it's the player who should take the shot.
  private updateCoach(next: number) {
    const coach = this.opts.coach
    if (!coach) return
    const intro = this.phase === "intro" && next >= 0 && performance.now() - this.born > 1200
    const shot = this.phase === "build" && this.canShoot && this.holder >= 0 && !this.locked && !this.shooting && this.mode === "play"
    const show = intro || shot
    coach.dataset.show = show ? "true" : "false"
    coach.dataset.mode = shot ? "shot" : "intro"
    if (!show) return
    const { w, h } = this.size
    const v = this.tmp.copy(this.home[shot ? this.holder : next].a.root.position)
    v.y += 1.1
    v.project(this.camera)
    const cx = ((v.x + 1) / 2) * w
    const cy = ((1 - v.y) / 2) * h
    coach.style.setProperty("--cx", `${cx}px`)
    coach.style.setProperty("--cy", `${cy}px`)
    const label = coach.firstElementChild as HTMLElement | null
    if (!label) return
    const lw = label.offsetWidth, lh = label.offsetHeight
    let x: number, y: number, side: string
    if (w < 640) {
      // phones: the label sits in a fixed spot above the pass bar; the spotlight does the pointing
      label.style.transform = ""
      label.dataset.side = "fixed"
      return
    } else {
      const right = w - (this.panel === "side" ? 470 : 16)
      side = cx + 110 + lw < right ? "right" : "left"
      x = side === "right" ? cx + 110 : cx - 110 - lw
      y = THREE.MathUtils.clamp(cy - lh / 2, 70, h - lh - 90)
    }
    label.style.transform = `translate3d(${x}px, ${y}px, 0)`
    label.dataset.side = side
    label.style.setProperty("--ax", `${cx - x}px`)
    label.style.setProperty("--ay", `${cy - y}px`)
  }

  private updateTags() {
    const { tags, squad } = this.opts
    const { w, h } = this.size
    const v = this.tmp
    const next = this.next
    this.updateCoach(next)
    this.home.forEach((m, i) => {
      const el = tags.get(squad[i].slug)
      if (!el) return
      v.copy(m.a.root.position)
      v.y += 2.3
      v.project(this.camera)
      const behind = v.z > 1
      let x = ((v.x + 1) / 2) * w
      let y = ((1 - v.y) / 2) * h
      const edge = x < 50 || x > w - 50 || y < 60 || y > h - 40
      x = THREE.MathUtils.clamp(x, 50, w - 50)
      y = THREE.MathUtils.clamp(y, 60, h - 40)
      const hidden = this.mode === "follow" || this.mode === "aim" || this.phase === "scored" || i === this.holder || behind
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      el.dataset.hidden = hidden ? "true" : "false"
      el.dataset.edge = edge ? "true" : "false"
      el.dataset.next = i === next ? "true" : "false"
      el.dataset.hover = i === this.hovered ? "true" : "false"
    })
  }

  // ---------- input ----------

  private bindPointer() {
    const el = this.renderer.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hits = this.home.map((m) => m.a.hit)
    let down: { x: number; y: number } | null = null
    const pick = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, this.camera)
      const hit = ray.intersectObjects(hits, false)[0]
      return hit ? hits.indexOf(hit.object as THREE.Mesh) : -1
    }
    const goalPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), HALF_L)
    const aimPoint = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, this.camera)
      const p = ray.ray.intersectPlane(goalPlane, new THREE.Vector3())
      if (!p) return null
      p.y = THREE.MathUtils.clamp(p.y, 0.1, 3.8)
      p.z = THREE.MathUtils.clamp(p.z, -6, 6)
      return p
    }
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      this.parallax.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1)
      if (this.aiming >= 0) {
        const p = aimPoint(e)
        this.reticle.visible = !!p
        if (p) this.reticle.position.copy(p).setX(HALF_L - 0.05)
        el.style.cursor = "crosshair"
        return
      }
      if (e.pointerType !== "mouse") return
      const i = this.shooting ? -1 : pick(e)
      if (i !== this.hovered) {
        this.hovered = i
        el.style.cursor = i >= 0 ? "pointer" : ""
      }
    }
    const leave = () => {
      this.parallax.set(0, 0)
      this.hovered = -1
    }
    const pdown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY })
    const up = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return
      down = null
      if (this.aiming >= 0) {
        const p = aimPoint(e)
        if (p) {
          this.reticle.position.copy(p).setX(HALF_L - 0.05)
          this.reticle.visible = true
          el.style.cursor = ""
          this.shootAt(p)
        }
        return
      }
      const i = pick(e)
      if (i >= 0) this.select(this.opts.squad[i].slug)
    }
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerleave", leave)
    el.addEventListener("pointerdown", pdown)
    el.addEventListener("pointerup", up)
    this.cleanups.push(() => {
      el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerleave", leave)
      el.removeEventListener("pointerdown", pdown)
      el.removeEventListener("pointerup", up)
    })
  }

  // ---------- loop ----------

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(this.clock.getDelta(), 1 / 30)
    if (!this.visible || document.hidden) return
    this.time += dt

    while (true) {
      const i = this.timers.findIndex((t) => t.at <= this.time)
      if (i < 0) break
      const [t] = this.timers.splice(i, 1)
      t.fn()
    }

    this.stepPlayers(dt)
    this.stepBall(dt)

    const want = this.time < this.exciteUntil ? 1 : 0
    this.excite += (want - this.excite) * Math.min(1, dt * (want ? 4 : 1.2))
    this.world.uniforms.uExcite.value = this.opts.reduceMotion ? 0 : this.excite
    this.world.flashUniforms.uRate.value = 0.004 + this.excite * 0.05
    this.world.update(dt, this.time)

    this.updateCamera(dt)
    this.updateTags()
    if (this.composer) this.composer.render(dt)
    else this.renderer.render(this.scene, this.camera)
  }
}
