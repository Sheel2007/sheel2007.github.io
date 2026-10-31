import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

// Real dimensions in meters. x runs goal to goal, z touchline to touchline, y is up.
export const LENGTH = 105
export const WIDTH = 68
export const HALF_L = LENGTH / 2
export const HALF_W = WIDTH / 2
export const GOAL_HALF = 3.66
export const GOAL_H = 2.44
export const BALL_R = 0.16 // a touch bigger than a real ball so it reads from the stands
const NET_TOP = 1.0
const NET_BOTTOM = 2.0
// how far behind the goal line the back of the net is at height y
export const netDepth = (y: number) => NET_TOP + (1 - THREE.MathUtils.clamp(y / GOAL_H, 0, 1)) * (NET_BOTTOM - NET_TOP)

const BOARD_X = HALF_L + 5
const BOARD_Z = HALF_W + 4.5

function canvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  return [c, c.getContext("2d")!] as const
}
function texture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// ---------- grass ----------

function grass() {
  const s = 20 // px per meter
  const W = LENGTH + 10, D = WIDTH + 9
  const [c, g] = canvas(W * s, D * s)
  const X = (x: number) => (x + W / 2) * s
  const Y = (z: number) => (z + D / 2) * s

  // mowing stripes across the length, plus a faint cross-cut the other way
  const stripe = LENGTH / 18
  for (let x = -W / 2, i = 0; x < W / 2; x += stripe, i++) {
    const k = Math.round((x + HALF_L) / stripe)
    g.fillStyle = k % 2 ? "#2a5c30" : "#316a37"
    g.fillRect(X(x), 0, stripe * s + 1, c.height)
  }
  for (let z = -D / 2, i = 0; z < D / 2; z += stripe, i++) {
    g.fillStyle = i % 2 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.03)"
    g.fillRect(0, Y(z), c.width, stripe * s + 1)
  }
  // fine grain
  const img = g.getImageData(0, 0, c.width, c.height)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16
    img.data[i] += n * 0.6
    img.data[i + 1] += n
    img.data[i + 2] += n * 0.5
  }
  g.putImageData(img, 0, 0)
  // worn goalmouths
  for (const side of [-1, 1]) {
    const grad = g.createRadialGradient(X(side * (HALF_L - 4)), Y(0), 0, X(side * (HALF_L - 4)), Y(0), 7 * s)
    grad.addColorStop(0, "rgba(120,110,70,0.22)")
    grad.addColorStop(1, "rgba(120,110,70,0)")
    g.fillStyle = grad
    g.fillRect(0, 0, c.width, c.height)
  }

  g.strokeStyle = "rgba(240,242,236,0.92)"
  g.fillStyle = "rgba(240,242,236,0.92)"
  g.lineWidth = 0.12 * s
  const line = (pts: [number, number][]) => {
    g.beginPath()
    pts.forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))))
    g.stroke()
  }
  const arc = (x: number, z: number, r: number, a0 = 0, a1 = Math.PI * 2) => {
    g.beginPath()
    g.arc(X(x), Y(z), r * s, a0, a1)
    g.stroke()
  }
  const spot = (x: number, z: number, r = 0.22) => {
    g.beginPath()
    g.arc(X(x), Y(z), r * s, 0, Math.PI * 2)
    g.fill()
  }
  line([[-HALF_L, -HALF_W], [HALF_L, -HALF_W], [HALF_L, HALF_W], [-HALF_L, HALF_W], [-HALF_L, -HALF_W]])
  line([[0, -HALF_W], [0, HALF_W]])
  arc(0, 0, 9.15)
  spot(0, 0, 0.3)
  for (const side of [-1, 1]) {
    const gx = side * HALF_L
    line([[gx, -20.16], [gx - side * 16.5, -20.16], [gx - side * 16.5, 20.16], [gx, 20.16]])
    line([[gx, -9.16], [gx - side * 5.5, -9.16], [gx - side * 5.5, 9.16], [gx, 9.16]])
    spot(gx - side * 11, 0)
    const a = Math.acos(5.5 / 9.15)
    if (side < 0) arc(gx + 11, 0, 9.15, -a, a)
    else arc(gx - 11, 0, 9.15, Math.PI - a, Math.PI + a)
    arc(gx, -HALF_W, 1, side < 0 ? 0 : Math.PI / 2, side < 0 ? Math.PI / 2 : Math.PI)
    arc(gx, HALF_W, 1, side < 0 ? -Math.PI / 2 : Math.PI, side < 0 ? 0 : (Math.PI * 3) / 2)
  }

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W, D),
    new THREE.MeshStandardMaterial({ map: texture(c), roughness: 0.92, metalness: 0 }),
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  return mesh
}

// ---------- stands and crowd ----------

type Tier = { at: number; base: number; y0: number; rows: number; depth: number; rise: number; back: number }

function tierShape({ base, y0, rows, depth, rise, back }: Tier) {
  const s = new THREE.Shape()
  s.moveTo(0, base)
  s.lineTo(0, y0)
  for (let r = 0; r < rows; r++) {
    s.lineTo((r + 1) * depth, y0 + r * rise)
    if (r < rows - 1) s.lineTo((r + 1) * depth, y0 + (r + 1) * rise)
  }
  const end = rows * depth
  s.lineTo(end, back)
  s.lineTo(end + 0.8, back)
  s.lineTo(end + 0.8, base)
  s.closePath()
  return s
}

// Crowd boxes bob in the vertex shader, so a goal can make the whole stadium jump without touching the CPU.
export type CrowdUniforms = { uTime: { value: number }; uExcite: { value: number } }

// One fan: a body that takes the instance color and a head (color.r = 1) that takes a skin tone.
function fanGeometry() {
  const body = new THREE.CylinderGeometry(0.18, 0.22, 0.6, 6).toNonIndexed()
  body.translate(0, 0.3, 0)
  const head = new THREE.IcosahedronGeometry(0.105, 0)
  head.translate(0, 0.73, 0)
  for (const [g, v] of [[body, 0], [head, 1]] as const) {
    g.deleteAttribute("uv")
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(g.getAttribute("position").count * 3).fill(v), 3))
  }
  return mergeGeometries([body, head])!
}

function crowdMaterial(uniforms: CrowdUniforms) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uExcite = uniforms.uExcite
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aPhase;\nuniform float uTime;\nuniform float uExcite;",
      )
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
        #ifdef USE_INSTANCING_COLOR
          vec3 skin = mix(vec3(0.36, 0.22, 0.14), vec3(0.82, 0.62, 0.47), fract(aPhase * 13.7));
          vColor.rgb = mix(instanceColor.rgb, skin * 0.8, color.r);
        #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        if (aPhase >= 0.0) {
          float idle = 0.03 * sin(uTime * 1.4 + aPhase * 40.0);
          float jump = abs(sin(uTime * (7.0 + aPhase * 3.0) + aPhase * 60.0)) * 0.42;
          transformed.y += (idle + jump * uExcite) / max(instanceMatrix[1][1], 0.01);
        }`,
      )
  }
  return m
}

const FANS: [string, number][] = [
  ["#c8102e", 30], ["#a50d24", 10], ["#f1ede4", 16], ["#16150f", 14], ["#2b2b30", 10], ["#5a5f66", 6],
  ["#2d4f8a", 4], ["#7a6a55", 4], ["#d9b35a", 2], ["#1e5631", 4],
]
function pick(weights: [string, number][]) {
  const total = weights.reduce((a, [, w]) => a + w, 0)
  let r = Math.random() * total
  for (const [c, w] of weights) if ((r -= w) <= 0) return c
  return weights[0][0]
}

function stand(
  out: THREE.Vector3,
  front: number,
  length: number,
  tiers: Tier[],
  roof: { y: number; from: number; to: number } | null,
  spacing: number,
  uniforms: CrowdUniforms,
  away = false,
) {
  // local frame: x points away from the pitch, z runs along the stand, y is up
  const group = new THREE.Group()
  group.rotation.y = Math.atan2(out.x, out.z) - Math.PI / 2
  const along = new THREE.Vector3(0, 0, 1).applyEuler(group.rotation)
  group.position.copy(out).multiplyScalar(front).addScaledVector(along, -length / 2)

  const concrete = new THREE.MeshStandardMaterial({ color: 0x2f3236, roughness: 0.95 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.9 })

  const slots: { x: number; y: number; z: number }[] = []
  for (const t of tiers) {
    const geo = new THREE.ExtrudeGeometry(tierShape(t), { depth: length, bevelEnabled: false })
    const m = new THREE.Mesh(geo, concrete)
    m.position.x = t.at
    group.add(m)
    for (let r = 0; r < t.rows; r++)
      for (let z = spacing / 2; z < length; z += spacing)
        slots.push({ x: t.at + (r + 0.55) * t.depth, y: t.y0 + r * t.rise, z })
  }

  const fans = slots.filter(() => Math.random() > 0.07)
  const empty = slots.filter((s) => !fans.includes(s))
  const crowd = new THREE.InstancedMesh(fanGeometry(), crowdMaterial(uniforms), fans.length)
  const phase = new Float32Array(fans.length)
  const mtx = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const scl = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const col = new THREE.Color()
  fans.forEach((s, i) => {
    pos.set(s.x + (Math.random() - 0.5) * 0.12, s.y, s.z + (Math.random() - 0.5) * 0.2)
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, (Math.random() - 0.5) * 0.5)
    scl.set(0.9 + Math.random() * 0.25, 0.9 + Math.random() * 0.22, 0.9 + Math.random() * 0.2)
    col.set(away && s.z < length * 0.3 ? pick([["#f2c230", 6], ["#16150f", 3], ["#f1ede4", 1]]) : pick(FANS))
    col.multiplyScalar(0.4 + Math.random() * 0.28)
    phase[i] = Math.random()
    crowd.setMatrixAt(i, mtx.compose(pos, q, scl))
    crowd.setColorAt(i, col)
  })
  crowd.geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1))
  group.add(crowd)

  const seatGeo = new THREE.BoxGeometry(0.44, 0.3, 0.4)
  seatGeo.translate(0, 0.15, 0)
  const seats = new THREE.InstancedMesh(seatGeo, new THREE.MeshLambertMaterial({ color: 0x4a1119 }), Math.max(1, empty.length))
  empty.forEach((s, i) => seats.setMatrixAt(i, mtx.makeTranslation(s.x, s.y, s.z)))
  seats.count = empty.length
  group.add(seats)

  const last = tiers[tiers.length - 1]
  const backX = last.at + last.rows * last.depth + 0.8
  if (roof) {
    const depth = roof.to - roof.from
    const top = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.7, length + 2), dark)
    top.position.set(roof.from + depth / 2, roof.y, length / 2)
    top.rotation.z = -0.05
    group.add(top)
    // strip lights under the leading edge
    const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color(4.5, 4.4, 4.1) })
    for (const k of [0.6, 4.5]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, length - 4), strip)
      l.position.set(roof.from + k, roof.y - 0.45 + k * 0.05, length / 2)
      group.add(l)
    }
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.6, roof.y, length + 2), dark)
    wall.position.set(backX + 0.3, roof.y / 2, length / 2)
    group.add(wall)
    for (let z = 0; z <= length + 0.1; z += length / 6) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, roof.y, 0.6), dark)
      col.position.set(backX + 1, roof.y / 2, z)
      group.add(col)
    }
  }
  // tunnel-colored fascia along the front wall
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, length), new THREE.MeshStandardMaterial({ color: 0x5c1520, roughness: 0.8 }))
  fascia.position.set(-0.06, tiers[0].y0 - 0.55, length / 2)
  group.add(fascia)

  return { group, crowd, slots, frame: group }
}

// ---------- LED boards ----------

function boardTexture(family: string) {
  const H = 128, P = 640
  const panels: [string, string, string][] = [
    ["SHEEL SHAH", "#c8102e", "#fff6ef"],
    ["SOFTWARE · ML · HARDWARE", "#16150f", "#f1ede4"],
    ["ORBITTERP", "#f1ede4", "#16150f"],
    ["AEGIS ORBIT", "#1e5631", "#f1ede4"],
    ["WORLD CUP 2026", "#c8102e", "#fff6ef"],
    ["HOME BOARD", "#16150f", "#f1ede4"],
    ["AUTONOMOUS EV", "#f1ede4", "#c8102e"],
    ["SHEELSHAH030@GMAIL.COM", "#16150f", "#f1ede4"],
  ]
  const [c, g] = canvas(P * panels.length, H)
  panels.forEach(([text, bg, fg], i) => {
    g.fillStyle = bg
    g.fillRect(i * P, 0, P, H)
    g.fillStyle = fg
    g.font = `800 ${text.length > 16 ? 58 : 76}px ${family}`
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.fillText(text, i * P + P / 2, H / 2 + 4)
  })
  // LED pixel grid
  g.fillStyle = "rgba(0,0,0,0.28)"
  for (let x = 0; x < c.width; x += 4) g.fillRect(x, 0, 1, H)
  for (let y = 0; y < H; y += 4) g.fillRect(0, y, c.width, 1)
  const t = texture(c)
  t.wrapS = THREE.RepeatWrapping
  return { tex: t, metersPerLoop: (c.width / H) * 0.9 }
}

function boards(family: string) {
  const group = new THREE.Group()
  const { tex, metersPerLoop } = boardTexture(family)
  const back = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.7 })
  const runs: { x: number; z: number; len: number; yaw: number }[] = [
    { x: 0, z: -BOARD_Z, len: LENGTH + 4, yaw: 0 },
    { x: 0, z: BOARD_Z, len: LENGTH + 4, yaw: Math.PI },
    { x: -BOARD_X, z: -21, len: 26, yaw: Math.PI / 2 },
    { x: -BOARD_X, z: 21, len: 26, yaw: Math.PI / 2 },
    { x: BOARD_X, z: -21, len: 26, yaw: -Math.PI / 2 },
    { x: BOARD_X, z: 21, len: 26, yaw: -Math.PI / 2 },
  ]
  const textures: THREE.Texture[] = []
  for (const r of runs) {
    const t = tex.clone()
    t.repeat.x = r.len / metersPerLoop
    t.offset.x = Math.random()
    textures.push(t)
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(r.len, 0.9),
      new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(1.15, 1.15, 1.15) }),
    )
    const box = new THREE.Mesh(new THREE.BoxGeometry(r.len, 1.0, 0.22), back)
    box.position.z = -0.12
    box.position.y = -0.02
    const unit = new THREE.Group()
    unit.add(face, box)
    unit.position.set(r.x, 0.5, r.z)
    unit.rotation.y = r.yaw
    face.receiveShadow = false
    group.add(unit)
  }
  return {
    group,
    update(dt: number) {
      for (const t of textures) t.offset.x = (t.offset.x + dt * 0.035) % 1
    },
  }
}

// ---------- floodlights ----------

function glowMaterial() {
  const [c, g] = canvas(128, 128)
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, "rgba(255,250,240,1)")
  grad.addColorStop(0.18, "rgba(255,246,228,0.45)")
  grad.addColorStop(0.5, "rgba(255,240,215,0.08)")
  grad.addColorStop(1, "rgba(255,240,215,0)")
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  return new THREE.SpriteMaterial({ map: texture(c), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
}

function floodlights() {
  const group = new THREE.Group()
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a3e42, roughness: 0.6, metalness: 0.4 })
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 4.9, 4.5) })
  const glow = glowMaterial()
  const lampGeo = new THREE.BoxGeometry(0.75, 0.75, 0.2)
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const x = sx * (HALF_L + 15), z = sz * (HALF_W + 19)
      const h = 52
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.1, h, 10), steel)
      mast.position.set(x, h / 2, z)
      group.add(mast)
      const head = new THREE.Group()
      head.position.set(x, h + 2.5, z)
      head.lookAt(0, 0, 0)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(9.6, 5.6, 0.6), steel)
      head.add(frame)
      for (let i = 0; i < 8; i++)
        for (let j = 0; j < 4; j++) {
          const l = new THREE.Mesh(lampGeo, lamp)
          l.position.set(-4.2 + i * 1.2, -1.8 + j * 1.2, 0.35)
          head.add(l)
        }
      const halo = new THREE.Sprite(glow)
      halo.scale.set(34, 34, 1)
      halo.position.set(0, 0, 2)
      head.add(halo)
      group.add(head)
    }
  return group
}

// ---------- goals ----------

function netTexture() {
  const [c, g] = canvas(64, 64)
  g.strokeStyle = "rgba(255,255,255,1)"
  g.lineWidth = 5
  g.strokeRect(0, 0, 64, 64)
  const t = texture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

function surface(fn: (u: number, v: number, out: THREE.Vector3) => void, nu: number, nv: number, uLen: number, vLen: number) {
  const cell = 0.13
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  const p = new THREE.Vector3()
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      fn(i / nu, j / nv, p)
      pos.push(p.x, p.y, p.z)
      uv.push(((i / nu) * uLen) / cell, ((j / nv) * vLen) / cell)
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export type Goal = { group: THREE.Group; ripple(y: number, z: number, strength: number): void; update(dt: number): void }

function goal(side: 1 | -1, netMat: THREE.Material): Goal {
  const group = new THREE.Group()
  group.position.x = side * HALF_L
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.35 })
  const support = new THREE.MeshStandardMaterial({ color: 0xd9d9d4, roughness: 0.5 })
  const bar = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
    const len = a.distanceTo(b)
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), m)
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    mesh.castShadow = true
    group.add(mesh)
  }
  const V = (x: number, y: number, z: number) => new THREE.Vector3(side * x, y, z)
  for (const z of [-GOAL_HALF, GOAL_HALF]) {
    bar(V(0, 0, z), V(0, GOAL_H + 0.06, z), 0.06, white)
    bar(V(0, GOAL_H, z), V(NET_TOP, GOAL_H, z), 0.025, support)
    bar(V(NET_TOP, GOAL_H, z), V(NET_BOTTOM, 0, z), 0.025, support)
  }
  bar(V(0, GOAL_H, -GOAL_HALF - 0.06), V(0, GOAL_H, GOAL_HALF + 0.06), 0.06, white)
  bar(V(NET_TOP, GOAL_H, -GOAL_HALF), V(NET_TOP, GOAL_H, GOAL_HALF), 0.025, support)
  bar(V(NET_BOTTOM, 0.03, -GOAL_HALF), V(NET_BOTTOM, 0.03, GOAL_HALF), 0.03, support)

  const W = GOAL_HALF * 2
  const backGeo = surface(
    (u, v, o) => {
      const y = v * GOAL_H
      const sag = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.08
      o.set(side * (netDepth(y) + sag), y, -GOAL_HALF + u * W)
    },
    40, 14, W, Math.hypot(GOAL_H, NET_BOTTOM - NET_TOP),
  )
  const roofGeo = surface(
    (u, v, o) => o.set(side * v * NET_TOP, GOAL_H - Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.06, -GOAL_HALF + u * W),
    24, 6, W, NET_TOP,
  )
  const sideGeo = (z: number) =>
    surface((u, v, o) => {
      const y = v * GOAL_H
      o.set(side * u * netDepth(y), y, z)
    }, 10, 14, NET_BOTTOM, GOAL_H)
  for (const geo of [backGeo, roofGeo, sideGeo(-GOAL_HALF), sideGeo(GOAL_HALF)]) {
    const m = new THREE.Mesh(geo, netMat)
    m.renderOrder = 2
    group.add(m)
  }

  const base = (backGeo.getAttribute("position").array as Float32Array).slice()
  const hits: { y: number; z: number; s: number; age: number }[] = []
  return {
    group,
    ripple(y, z, s) {
      hits.push({ y, z, s, age: 0 })
    },
    update(dt) {
      if (!hits.length) return
      const attr = backGeo.getAttribute("position") as THREE.BufferAttribute
      const a = attr.array as Float32Array
      for (const h of hits) h.age += dt
      while (hits.length && hits[0].age > 2.5) hits.shift()
      for (let i = 0; i < a.length; i += 3) {
        let d = 0
        for (const h of hits) {
          const r2 = (base[i + 1] - h.y) ** 2 + (base[i + 2] - h.z) ** 2
          d += h.s * Math.exp(-r2 / 1.1) * Math.exp(-h.age * 3.2) * Math.cos(h.age * 13)
        }
        a[i] = base[i] + side * d
      }
      attr.needsUpdate = true
      if (!hits.length) a.set(base)
    },
  }
}

// ---------- ball ----------

// Classic 32-panel ball: each face takes the color of the nearest panel center, with dark seams where two panels meet.
export function ball() {
  const geo = new THREE.IcosahedronGeometry(BALL_R, 18)
  const ico = new THREE.IcosahedronGeometry(1, 0)
  const ip = ico.getAttribute("position")
  const pent: THREE.Vector3[] = []
  const hex: THREE.Vector3[] = []
  for (let i = 0; i < ip.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(ip, i).normalize()
    if (!pent.some((c) => c.distanceTo(v) < 1e-3)) pent.push(v)
  }
  for (let i = 0; i < ip.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(ip, i)
    const b = new THREE.Vector3().fromBufferAttribute(ip, i + 1)
    const c = new THREE.Vector3().fromBufferAttribute(ip, i + 2)
    hex.push(a.add(b).add(c).normalize())
  }
  const centers = [...pent.map((v) => [v, 1] as const), ...hex.map((v) => [v, 0] as const)]
  const pos = geo.getAttribute("position")
  const colors = new Float32Array(pos.count * 3)
  const normals = new Float32Array(pos.count * 3)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + 2)
    const m = a.clone().add(b).add(c).normalize()
    let best = -2, second = -2, dark = 0
    for (const [v, isPent] of centers) {
      const d = v.dot(m)
      if (d > best) {
        second = best
        best = d
        dark = isPent
      } else if (d > second) second = d
    }
    const seam = best - second < 0.012
    const shade = seam ? 0.25 : dark ? 0.05 : 0.93
    for (let k = 0; k < 3; k++) {
      colors.set([shade, shade, shade * (dark || seam ? 1 : 0.97)], (i + k) * 3)
      const v = [a, b, c][k].clone().normalize()
      normals.set([v.x, v.y, v.z], (i + k) * 3)
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38 }))
  mesh.castShadow = true
  return mesh
}

// ---------- everything ----------

export function buildWorld(scene: THREE.Scene, family: string, lite: boolean) {
  const uniforms: CrowdUniforms = { uTime: { value: 0 }, uExcite: { value: 0 } }

  // sky: dark gradient with a faint glow where the floodlights wash the haze
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(420, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {},
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "varying vec3 vP; void main(){ float h = clamp(vP.y, 0.0, 1.0); vec3 top = vec3(0.012,0.016,0.026); vec3 hor = vec3(0.07,0.075,0.085); gl_FragColor = vec4(mix(hor, top, pow(h, 0.45)), 1.0); }",
    }),
  )
  scene.add(sky)

  scene.add(grass())
  const surround = new THREE.Mesh(new THREE.PlaneGeometry(240, 190), new THREE.MeshStandardMaterial({ color: 0x1a1d1c, roughness: 1 }))
  surround.rotation.x = -Math.PI / 2
  surround.position.y = -0.02
  surround.receiveShadow = true
  scene.add(surround)

  const spacing = lite ? 0.95 : 0.7
  const longLower: Tier = { at: 0, base: 0, y0: 1.3, rows: 22, depth: 0.85, rise: 0.42, back: 10.6 }
  const farUpper: Tier = { at: 15, base: 12.4, y0: 14.6, rows: 18, depth: 0.9, rise: 0.55, back: 31 }
  const endTier: Tier = { at: 0, base: 0, y0: 1.3, rows: 24, depth: 0.85, rise: 0.45, back: 17.5 }
  const stands = [
    stand(new THREE.Vector3(0, 0, -1), HALF_W + 8, 108, [{ ...longLower, back: 13 }, farUpper], { y: 31, from: 3, to: 32.2 }, spacing, uniforms),
    stand(new THREE.Vector3(0, 0, 1), HALF_W + 8, 108, [longLower], null, spacing, uniforms),
    stand(new THREE.Vector3(-1, 0, 0), HALF_L + 9, 70, [endTier], { y: 17.5, from: 2, to: 21.2 }, spacing, uniforms),
    stand(new THREE.Vector3(1, 0, 0), HALF_L + 9, 70, [endTier], { y: 17.5, from: 2, to: 21.2 }, spacing, uniforms, true),
  ]
  for (const s of stands) scene.add(s.group)

  // camera flashes scattered through the crowd
  const flashPos: number[] = []
  const flashPhase: number[] = []
  const v = new THREE.Vector3()
  for (const s of stands) {
    s.group.updateMatrixWorld()
    for (let i = 0; i < 260; i++) {
      const slot = s.slots[(Math.random() * s.slots.length) | 0]
      v.set(slot.x, slot.y + 0.9, slot.z).applyMatrix4(s.group.matrixWorld)
      flashPos.push(v.x, v.y, v.z)
      flashPhase.push(Math.random())
    }
  }
  const flashGeo = new THREE.BufferGeometry()
  flashGeo.setAttribute("position", new THREE.Float32BufferAttribute(flashPos, 3))
  flashGeo.setAttribute("aPhase", new THREE.Float32BufferAttribute(flashPhase, 1))
  const flashUniforms = { uTime: { value: 0 }, uRate: { value: 0.004 }, uScale: { value: 300 } }
  const flashes = new THREE.Points(
    flashGeo,
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: flashUniforms,
      vertexShader: `attribute float aPhase; uniform float uTime; uniform float uRate; uniform float uScale; varying float vA;
        void main(){ float f = fract(uTime * uRate + aPhase); float w = uRate * 0.08; vA = f < w ? 1.0 - f / w : 0.0;
        vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = vA > 0.0 ? uScale / -mv.z : 0.0; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vec3(3.0), vA * (1.0 - d * 2.0)); }`,
    }),
  )
  flashes.frustumCulled = false
  scene.add(flashes)

  const ads = boards(family)
  scene.add(ads.group)
  scene.add(floodlights())

  const netMat = new THREE.MeshStandardMaterial({
    map: netTexture(),
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.9,
    color: 0xf2f2ee,
  })
  netMat.alphaMap = netMat.map
  const goals = [goal(-1, netMat), goal(1, netMat)] as const
  for (const g of goals) scene.add(g.group)

  // corner flags
  const pole = new THREE.MeshStandardMaterial({ color: 0xf0efe8, roughness: 0.5 })
  const flag = new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: 0.8, side: THREE.DoubleSide })
  const flags: THREE.Mesh[] = []
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), pole)
      p.position.set(sx * HALF_L, 0.8, sz * HALF_W)
      p.castShadow = true
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.32, 6, 1), flag)
      f.geometry.translate(0.225, 0, 0)
      f.position.set(sx * HALF_L, 1.42, sz * HALF_W)
      f.castShadow = true
      scene.add(p, f)
      flags.push(f)
    }

  // lighting: one key floodlight casts the shadows, the other three corners fill
  scene.add(new THREE.HemisphereLight(0xb8c8e8, 0x14200f, 0.35))
  const key = new THREE.DirectionalLight(0xfff4e2, 2.2)
  key.position.set(-40, 75, 45)
  key.castShadow = true
  key.shadow.mapSize.set(lite ? 1024 : 2048, lite ? 1024 : 2048)
  key.shadow.bias = -0.0004
  key.shadow.normalBias = 0.02
  key.shadow.camera.near = 1
  key.shadow.camera.far = 260
  scene.add(key, key.target)
  for (const [x, z, i] of [[60, 45, 0.9], [-60, -45, 0.8], [60, -45, 0.7]] as const) {
    const l = new THREE.DirectionalLight(0xf2f0ff, i)
    l.position.set(x, 70, z)
    scene.add(l)
  }

  return {
    goals,
    key,
    uniforms,
    flashUniforms,
    update(dt: number, time: number) {
      uniforms.uTime.value = time
      flashUniforms.uTime.value = time
      ads.update(dt)
      for (const g of goals) g.update(dt)
      flags.forEach((f, i) => (f.rotation.y = Math.sin(time * 1.3 + i) * 0.25))
    },
  }
}
