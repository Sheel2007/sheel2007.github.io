import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js"

// Character and animations: Quaternius "Universal Base Characters" and "Universal Animation Library" (CC0).
export type Assets = { model: THREE.Group; clips: Map<string, THREE.AnimationClip>; lightSkin: THREE.Texture }

export async function loadAssets(base = "/models/"): Promise<Assets> {
  const loader = new GLTFLoader()
  const [player, moves, lightSkin] = await Promise.all([
    loader.loadAsync(base + "player.glb"),
    loader.loadAsync(base + "moves.glb"),
    new THREE.TextureLoader().loadAsync(base + "skin-light.jpg"),
  ])
  lightSkin.colorSpace = THREE.SRGBColorSpace
  lightSkin.flipY = false
  const clips = new Map<string, THREE.AnimationClip>()
  for (const clip of moves.animations) {
    // the animation rig's hips sit a few cm lower than this character's
    for (const t of clip.tracks) if (t.name === "pelvis.position") for (let i = 0; i < t.values.length; i++) t.values[i] *= 1.035
    clips.set(clip.name, clip)
  }
  return { model: player.scene, clips, lightSkin }
}

export type Kit = {
  shirt: string
  trim: string
  shorts: string
  socks: string
  band: string
  print: string
  longSleeves?: boolean
  gloves?: string
}
export type Look = { skin: "light" | "dark"; tint: string; hair: "Hair_Buzzed" | "Hair_SimpleParted" | null; beard?: boolean; hairColor: string; boots: string }

// Body regions in the bind pose (meters, T-pose, facing +z), used by the fragment shader: 0 skin, 1 boots, 2 socks, 3 band, 4 shorts, 5 shirt, 6 trim, 7 glove.
const REGION = /* glsl */ `
uniform float uGloves, uLong;
float kitRegion(vec3 b) {
  float ax = abs(b.x);
  if (b.y < 0.115) return 1.0;
  if (b.y < 0.44) return 2.0;
  if (b.y < 0.5) return 3.0;
  if (b.y < 0.63) return 0.0;
  if (b.y < 1.0 && ax < 0.34) return 4.0;
  if (ax > 0.215 && b.y > 1.3) {
    float sleeve = uLong > 0.5 ? 0.64 : 0.39;
    if (ax < sleeve) return ax > sleeve - 0.025 ? 6.0 : 5.0;
    if (uGloves > 0.5 && ax > 0.63) return 7.0;
    return 0.0;
  }
  if (b.y >= 1.0) {
    float collar = b.z > 0.0 ? 1.5 : 1.51;
    if (ax < 0.07 && b.y > collar) return 0.0;
    if (b.y < 1.6) return (ax < 0.085 && b.y > collar - 0.02) ? 6.0 : 5.0;
  }
  return 0.0;
}`

const KIT_FRAG = /* glsl */ `
#include <map_fragment>
float kitMask = 0.0;
{
  vec3 b = vBind;
  float r = kitRegion(b);
  vec3 kit = diffuseColor.rgb;
  if (r == 1.0) kit = uBoots;
  else if (r == 2.0) kit = uSocks;
  else if (r == 3.0) kit = uBand;
  else if (r == 4.0) kit = uShorts;
  else if (r == 6.0) kit = uTrim;
  else if (r == 7.0) kit = uGlove;
  else if (r == 5.0) {
    kit = uShirt;
    // name and number on the back, small number on the chest
    float ax = abs(b.x);
    if (b.z < -0.03 && ax < 0.19 && b.y > 1.06 && b.y < 1.44) {
      vec4 p = texture2D(uPrint, vec2(0.5 * (0.19 - b.x) / 0.38, (b.y - 1.06) / 0.38));
      kit = mix(kit, uPrintColor, p.a);
    } else if (b.z > 0.05 && ax < 0.06 && b.y > 1.23 && b.y < 1.35) {
      vec4 p = texture2D(uPrint, vec2(0.5 + 0.5 * (b.x + 0.06) / 0.12, (b.y - 1.23) / 0.12));
      kit = mix(kit, uPrintColor, p.a);
    }
  }
  if (r > 0.5) kitMask = 1.0;
  diffuseColor.rgb = kit;
}`

function printTexture(name: string, num: number, family: string) {
  const c = document.createElement("canvas")
  c.width = 512
  c.height = 256
  const g = c.getContext("2d")!
  g.fillStyle = "#fff"
  g.textAlign = "center"
  g.textBaseline = "middle"
  // back: 0.38 m square drawn into the left 256 x 256
  g.font = `700 ${name.length > 8 ? 26 : 32}px ${family}`
  ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "2px"
  g.fillText(name, 128, 34)
  ;(g as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px"
  g.font = `800 150px ${family}`
  g.fillText(String(num), 128, 150)
  // chest: right 256 x 256
  g.font = `800 180px ${family}`
  g.fillText(String(num), 384, 136)
  const t = new THREE.CanvasTexture(c)
  t.anisotropy = 4
  return t
}

const col = (s: string) => new THREE.Color(s)

const AXIS_X = new THREE.Vector3(1, 0, 0)
const AXIS_Z = new THREE.Vector3(0, 0, 1)
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const q3 = new THREE.Quaternion()
const v1 = new THREE.Vector3()

// Rotate a bone about an axis given in the character's own frame (x = left, y = up, z = forward).
function twist(bone: THREE.Object3D, axis: THREE.Vector3, angle: number, body: THREE.Object3D) {
  if (!angle) return
  body.getWorldQuaternion(q3)
  v1.copy(axis).applyQuaternion(q3)
  bone.parent!.getWorldQuaternion(q1)
  q2.setFromAxisAngle(v1, angle)
  // local' = parentWorld^-1 * R * parentWorld * local
  bone.quaternion.premultiply(q1.clone().invert().multiply(q2).multiply(q1))
}

const smooth = (t: number) => t * t * (3 - 2 * t)
const bump = (t: number, a: number, b: number, c: number) =>
  t < a || t > c ? 0 : t < b ? smooth((t - a) / (b - a)) : 1 - smooth((t - b) / (c - b))

export const CONTACT = 0.3

export class Athlete {
  root = new THREE.Group()
  body = new THREE.Group()
  hit: THREE.Mesh
  keeper: boolean
  yaw = 0
  targetYaw = 0
  speed = 0
  // dive: roll about the forward axis and lift, set by the engine
  roll = 0
  lift = 0
  armsUp = 0

  private mixer: THREE.AnimationMixer
  private idle: THREE.AnimationAction
  private jog: THREE.AnimationAction
  private sprint: THREE.AnimationAction
  private bones = new Map<string, THREE.Object3D>()
  private kickT = -1
  private trapT = -1
  private cheer = 0
  private headYaw = 0
  private seed: number

  constructor(assets: Assets, kit: Kit, look: Look, name: string, num: number, family: string, keeper = false) {
    this.keeper = keeper
    this.seed = num * 1.7
    const model = cloneSkinned(assets.model) as THREE.Group
    this.body.add(model)
    this.root.add(this.body)

    const uniforms = {
      uShirt: { value: col(kit.shirt) },
      uTrim: { value: col(kit.trim) },
      uShorts: { value: col(kit.shorts) },
      uSocks: { value: col(kit.socks) },
      uBand: { value: col(kit.band) },
      uBoots: { value: col(look.boots) },
      uGlove: { value: col(kit.gloves ?? "#ffffff") },
      uGloves: { value: kit.gloves ? 1 : 0 },
      uLong: { value: kit.longSleeves ? 1 : 0 },
      uPrint: { value: printTexture(name, num, family) },
      uPrintColor: { value: col(kit.print) },
    }

    model.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.frustumCulled = false
      const src = mesh.material as THREE.MeshStandardMaterial
      if (/^Hair_/.test(mesh.name)) {
        const show = mesh.name === look.hair || (mesh.name === "Hair_Beard" && !!look.beard)
        mesh.visible = show
        if (show) {
          const m = src.clone()
          m.color = col(look.hairColor)
          mesh.material = m
        }
        return
      }
      if (mesh.name === "SuperHero_Male" || src.name === "MI_Superhero_Male") {
        const m = src.clone()
        if (look.skin === "light") m.map = assets.lightSkin
        m.color = col(look.tint)
        m.normalScale = new THREE.Vector2(0.7, 0.7)
        m.onBeforeCompile = (shader) => {
          Object.assign(shader.uniforms, uniforms)
          shader.vertexShader = "varying vec3 vBind;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;")
          shader.fragmentShader =
            `varying vec3 vBind;
            uniform vec3 uShirt, uTrim, uShorts, uSocks, uBand, uBoots, uGlove, uPrintColor;
            uniform sampler2D uPrint;\n` +
            REGION +
            "\n" +
            shader.fragmentShader
              .replace("#include <map_fragment>", KIT_FRAG)
              .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.78, kitMask);")
              // cloth shouldn't show every muscle from the body's normal map
              .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, kitMask * 0.85));")
        }
        mesh.material = m
      }
    })
    model.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o)
    })

    this.mixer = new THREE.AnimationMixer(model)
    const act = (name: string) => {
      const a = this.mixer.clipAction(assets.clips.get(name)!)
      a.play()
      a.setEffectiveWeight(0)
      return a
    }
    this.idle = act(keeper ? "Idle_Loop" : Math.random() < 0.3 ? "Idle_Talking_Loop" : "Idle_Loop")
    this.jog = act("Jog_Fwd_Loop")
    this.sprint = act("Sprint_Loop")
    this.idle.setEffectiveWeight(1)
    this.idle.time = Math.random() * 2
    this.mixer.update(0)

    this.hit = new THREE.Mesh(new THREE.CapsuleGeometry(0.7, 1.2, 4, 8), new THREE.MeshBasicMaterial())
    this.hit.visible = false
    this.hit.position.y = 1
    this.root.add(this.hit)
  }

  kick() {
    this.kickT = 0
  }
  trap() {
    this.trapT = 0
  }
  celebrate(seconds: number) {
    this.cheer = seconds
  }
  get kicking() {
    return this.kickT >= 0
  }

  feet(out: THREE.Vector3, ahead = 0.45) {
    const s = this.root.scale.x
    return out.set(Math.sin(this.yaw) * ahead * s, 0, Math.cos(this.yaw) * ahead * s).add(this.root.position)
  }

  update(dt: number, time: number, look: THREE.Vector3 | null) {
    let d = this.targetYaw - this.yaw
    d = Math.atan2(Math.sin(d), Math.cos(d))
    this.yaw += d * (1 - Math.exp(-dt * (this.speed > 1 ? 9 : 6)))
    this.root.rotation.y = this.yaw

    // blend idle → jog → sprint by speed, and play the cycles at a pace that matches the ground speed
    const s = this.speed
    const wJog = s < 0.4 ? 0 : s < 2.5 ? (s - 0.4) / 2.1 : s < 5.5 ? 1 : Math.max(0, 1 - (s - 5.5) / 1.5)
    const wSprint = s < 5.5 ? 0 : Math.min(1, (s - 5.5) / 1.5)
    const wIdle = Math.max(0, 1 - wJog - wSprint)
    this.idle.setEffectiveWeight(wIdle)
    this.jog.setEffectiveWeight(wJog)
    this.sprint.setEffectiveWeight(wSprint)
    this.jog.timeScale = THREE.MathUtils.clamp(s / 3.4, 0.6, 1.5)
    this.sprint.timeScale = THREE.MathUtils.clamp(s / 6.8, 0.8, 1.4)
    this.mixer.update(dt)

    const B = (n: string) => this.bones.get(n)!
    const body = this.body
    body.position.y = this.lift
    body.rotation.z = this.roll
    body.updateMatrixWorld(true)

    // kick with the right foot: wind up, strike at CONTACT, follow through
    if (this.kickT >= 0) {
      const t = (this.kickT += dt)
      const back = bump(t, 0, 0.2, 0.3) * 0.9
      const through = bump(t, 0.22, 0.38, 0.75) * 1.25
      twist(B("thigh_r"), AXIS_X, back - through, body)
      twist(B("calf_r"), AXIS_X, bump(t, 0, 0.2, 0.34) * 1.4 + bump(t, 0.34, 0.45, 0.75) * 0.2, body)
      twist(B("upperarm_l"), AXIS_Z, (bump(t, 0.05, 0.25, 0.7) * 0.9), body)
      twist(B("upperarm_r"), AXIS_Z, -bump(t, 0.05, 0.25, 0.7) * 0.5, body)
      twist(B("spine_01"), AXIS_X, -bump(t, 0.2, 0.36, 0.7) * 0.15, body)
      if (t > 0.8) this.kickT = -1
    }
    if (this.trapT >= 0) {
      const t = (this.trapT += dt)
      twist(B("thigh_r"), AXIS_X, -bump(t, 0, 0.15, 0.45) * 0.45, body)
      twist(B("calf_r"), AXIS_X, bump(t, 0, 0.15, 0.45) * 0.6, body)
      if (t > 0.45) this.trapT = -1
    }

    let up = this.armsUp
    if (this.cheer > 0) {
      this.cheer -= dt
      up = 1
      body.position.y = Math.abs(Math.sin(time * 6 + this.seed)) * 0.28
      body.updateMatrixWorld(true)
    }
    if (up > 0) {
      twist(B("upperarm_l"), AXIS_Z, up * 2.6, body)
      twist(B("upperarm_r"), AXIS_Z, -up * 2.6, body)
      twist(B("lowerarm_l"), AXIS_Z, up * 0.3, body)
      twist(B("lowerarm_r"), AXIS_Z, -up * 0.3, body)
    }
    if (this.keeper && this.speed < 0.5 && !this.roll) {
      // ready stance
      twist(B("thigh_l"), AXIS_X, -0.35, body)
      twist(B("thigh_r"), AXIS_X, -0.35, body)
      twist(B("calf_l"), AXIS_X, 0.65, body)
      twist(B("calf_r"), AXIS_X, 0.65, body)
      twist(B("spine_01"), AXIS_X, 0.3, body)
      twist(B("upperarm_l"), AXIS_Z, 0.5, body)
      twist(B("upperarm_r"), AXIS_Z, -0.5, body)
      body.position.y = this.lift - 0.1
    }

    // head follows the ball
    let want = 0
    if (look) {
      const dx = look.x - this.root.position.x
      const dz = look.z - this.root.position.z
      if (dx * dx + dz * dz > 0.6) {
        want = Math.atan2(dx, dz) - this.yaw
        want = THREE.MathUtils.clamp(Math.atan2(Math.sin(want), Math.cos(want)), -1, 1)
      }
    }
    this.headYaw += (want - this.headYaw) * (1 - Math.exp(-dt * 5))
    twist(B("neck_01"), AXIS_Y, this.headYaw * 0.4, body)
    twist(B("Head"), AXIS_Y, this.headYaw * 0.6, body)
  }

  dispose() {
    this.mixer.stopAllAction()
    this.mixer.uncacheRoot(this.mixer.getRoot())
  }
}
