import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

/**
 * 진짜 입체 파우치 (WebGL) — 스파우트 파우치 모양을 계산으로 빚고, 도안(펼친 앞 · 뒤 그림)을 그대로 입힌다.
 * 도안이 텍스처라 글자가 뭉개지지 않고, 관리자가 도안을 바꾸면 모델도 따라 바뀐다.
 * three.js 가 커서 components/lineup/SvgPouch 가 필요할 때만 이 파일을 불러온다 (그 전에는 CSS 그림 파우치).
 *   createPouch3D     돌아가는 파우치 (메인 · 상세 무대) — 캔버스를 계속 쥐고 각도가 바뀔 때마다 다시 그린다
 *   renderPouchStill  멈춘 상품컷 (카드 · 썸네일) — 한 번 찍어 그림 주소로 돌려주고 WebGL 은 바로 놓는다
 *
 * 단위: 파우치 몸통 폭 = 1.
 */

const W = 1
const H = 1.6 // 몸통 높이 (도안 2:3.3 을 거의 그대로)
const T = 0.125 // 가장 부푼 곳의 반 두께
const SEAM = 0.035 // 접착된 가장자리 (두께 0)
const R_TOP = 0.1
const R_BOTTOM = 0.07
const CAP_R = 0.108
const CAP_H = 0.15
const NECK_R = 0.086
const NECK_H = 0.075
/** 몸통 + 목 + 뚜껑 */
const POUCH_HEIGHT = H + NECK_H + CAP_H

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (n: number) => n * n * (3 - 2 * n)
/** 가장자리 0 → 안쪽 1 로 둥글게 부푸는 곡선 */
const swell = (n: number) => Math.sin((clamp01(n) * Math.PI) / 2) ** 0.8

/** 그 높이에서 몸통의 반 폭 — 네 귀퉁이를 둥글게 깎는다 */
function halfWidth(v: number) {
  const fromBottom = v * H
  const fromTop = (1 - v) * H
  if (fromBottom < R_BOTTOM) return W / 2 - R_BOTTOM + Math.sqrt(R_BOTTOM ** 2 - (R_BOTTOM - fromBottom) ** 2)
  if (fromTop < R_TOP) return W / 2 - R_TOP + Math.sqrt(R_TOP ** 2 - (R_TOP - fromTop) ** 2)
  return W / 2
}

/** 필름 한 장이 앞으로 부푼 정도 */
function bulge(x: number, v: number, hw: number) {
  const side = swell((hw - Math.abs(x) - SEAM) / (W / 2 - SEAM))
  const bottom = swell((v * H - SEAM) / (0.3 * H))
  const top = swell(((1 - v) * H - SEAM) / (0.5 * H))
  // 즙이 아래로 쏠려 아래가 더 통통하다
  const body = T * side * bottom * top * (0.82 + 0.3 * (1 - v))
  // 필름이 살짝 우는 자리
  const wrinkle = 0.007 * Math.sin(9 * x + 5 * v + 1) * Math.sin(11 * v - 4 * x) * side * bottom * top
  // 스파우트가 끼워진 자리 — 위쪽 접착선이 가운데만 배 모양으로 벌어진다
  const fitment = 0.072 * Math.exp(-((x / 0.14) ** 2)) * (1 - smooth(clamp01(((1 - v) * H) / (0.13 * H))))
  return body + wrinkle + fitment
}

/** 몸통 한 면. facing 1 = 앞, -1 = 뒤 (뒤는 도안이 뒤에서 바로 읽히게 좌우를 뒤집는다) */
function bodyFace(facing: 1 | -1) {
  const NU = 56
  const NV = 84
  const pos = new Float32Array((NU + 1) * (NV + 1) * 3)
  const uv = new Float32Array((NU + 1) * (NV + 1) * 2)
  let p = 0
  let t = 0
  for (let j = 0; j <= NV; j++) {
    const v = j / NV
    const hw = halfWidth(v)
    for (let i = 0; i <= NU; i++) {
      const x = ((2 * i) / NU - 1) * hw
      pos[p++] = x
      pos[p++] = (v - 0.5) * H
      pos[p++] = facing * bulge(x, v, hw)
      const u = x / W + 0.5
      uv[t++] = facing === 1 ? u : 1 - u
      uv[t++] = v
    }
  }
  const index: number[] = []
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i
      const b = a + 1
      const c = a + NU + 1
      const d = c + 1
      if (facing === 1) index.push(a, b, d, a, d, c)
      else index.push(a, d, b, a, c, d)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

/** 세로 골이 팬 뚜껑 */
function capGeometry() {
  const bevel = 0.014
  const profile = [
    new Vector2(0, CAP_H),
    new Vector2(CAP_R - bevel, CAP_H),
    new Vector2(CAP_R, CAP_H - bevel),
    new Vector2(CAP_R, 0.012),
    new Vector2(CAP_R - 0.008, 0),
    new Vector2(0, 0),
  ]
  const g = new LatheGeometry(profile, 120)
  const a = g.getAttribute('position')
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i)
    const y = a.getY(i)
    const z = a.getZ(i)
    const r = Math.hypot(x, z)
    if (r < CAP_R - 0.001 || y < 0.02 || y > CAP_H - 0.02) continue
    const rib = 1 - 0.06 * smooth(clamp01(0.5 + 0.9 * Math.cos(30 * Math.atan2(z, x))))
    a.setX(i, x * rib)
    a.setZ(i, z * rib)
  }
  g.computeVertexNormals()
  return g
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`pouch art load failed: ${src}`))
    img.src = src
  })
}

/** 도안 → 텍스처. 투명한 곳은 도안의 평균색으로 채운다 (필름에 구멍이 나지 않게) */
function artTexture(img: HTMLImageElement, anisotropy: number) {
  const scale = Math.min(2, 2048 / img.naturalHeight)
  const c = document.createElement('canvas')
  c.width = Math.round(img.naturalWidth * scale)
  c.height = Math.round(img.naturalHeight * scale)
  const ctx = c.getContext('2d')!
  const probe = document.createElement('canvas')
  probe.width = probe.height = 1
  const pctx = probe.getContext('2d')!
  pctx.drawImage(img, 0, 0, 1, 1)
  const [r, g, b, a] = pctx.getImageData(0, 0, 1, 1).data // 교차 출처 그림이면 여기서 막힌다 → 호출한 쪽이 CSS 파우치로 남는다
  const k = a > 0 ? 255 / a : 0
  ctx.fillStyle = a > 0 ? `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})` : '#da1f2e'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = anisotropy
  return tex
}

export interface Pouch3D {
  /** ry = 몸을 도는 각도(도, CSS rotateY 와 같은 방향 · 180 이면 뒷면), rx = 세로로 넘어가는 각도(도, CSS rotateX 와 같은 방향) */
  setRotation(ry: number, rx?: number): void
  dispose(): void
}

/**
 * 캔버스 안에서 파우치가 놓이는 자리. 캔버스는 CSS 파우치 상자(.dd-pouch, 2:3)보다 넉넉하게 잡는다 (뚜껑 · 그림자가 잘리지 않게).
 *   box   상자 높이 ÷ 캔버스 높이
 *   scale 파우치 전체 높이(뚜껑 포함) ÷ 상자 높이 — 1 보다 크면 뚜껑이 상자 위로 올라온다
 * 파우치 바닥은 늘 상자 바닥에 닿는다 (메인에서 받침대에 내려앉는 계산이 상자 바닥 기준).
 */
export interface PouchFrame {
  box: number
  scale: number
}

export interface PouchArt {
  front: string
  back?: string | null
}

/** 렌더러 하나에 파우치 장면을 꾸린다 — 빛 · 재질 · 모양 · 카메라. size 로 캔버스 크기에 맞춘 뒤 render */
function buildScene(renderer: WebGLRenderer, frontImg: HTMLImageElement, backImg: HTMLImageElement | null, frame: PouchFrame) {
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = env.texture
  scene.environmentIntensity = 0.5
  pmrem.dispose()

  const key = new DirectionalLight(0xffffff, 2.4)
  key.position.set(-2.2, 2.6, 4)
  scene.add(key)
  const rim = new DirectionalLight(0xffffff, 1.6)
  rim.position.set(3, 1, -3)
  scene.add(rim)

  const anisotropy = renderer.capabilities.getMaxAnisotropy()
  const frontTex = artTexture(frontImg, anisotropy)
  const backTex = backImg ? artTexture(backImg, anisotropy) : frontTex
  const film = (map: CanvasTexture) =>
    new MeshPhysicalMaterial({ map, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3 })
  const plastic = new MeshStandardMaterial({ color: 0xececee, roughness: 0.48, metalness: 0 })
  const neckPlastic = new MeshStandardMaterial({ color: 0xf6f6f6, roughness: 0.6, metalness: 0 })

  const pouch = new Group()
  const meshes = [
    new Mesh(bodyFace(1), film(frontTex)),
    new Mesh(bodyFace(-1), film(backTex)),
    new Mesh(new CylinderGeometry(NECK_R, NECK_R, NECK_H + 0.1, 48), neckPlastic),
    new Mesh(new CylinderGeometry(NECK_R + 0.014, NECK_R + 0.014, 0.018, 48), neckPlastic),
    new Mesh(capGeometry(), plastic),
  ]
  meshes[2].position.y = H / 2 + NECK_H / 2 - 0.05
  meshes[3].position.y = H / 2 + NECK_H * 0.45
  meshes[4].position.y = H / 2 + NECK_H
  pouch.add(...meshes)
  // 화면에 보이는 높이(파우치 단위) · 파우치 바닥을 상자 바닥에
  const viewH = POUCH_HEIGHT / (frame.scale * frame.box)
  pouch.position.y = H / 2 - (frame.box * viewH) / 2
  const spin = new Group()
  spin.add(pouch)
  scene.add(spin)

  const camera = new PerspectiveCamera(18, 1, 0.1, 50)
  camera.position.z = viewH / (2 * Math.tan((camera.fov * Math.PI) / 360))

  return {
    spin,
    size(w: number, h: number) {
      const now = renderer.getSize(new Vector2())
      if (now.x === w && now.y === h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    },
    render: () => renderer.render(scene, camera),
    dispose() {
      for (const m of meshes) {
        m.geometry.dispose()
        ;(m.material as MeshStandardMaterial).dispose()
      }
      frontTex.dispose()
      backTex.dispose()
      env.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

const loadArt = (art: PouchArt) => Promise.all([loadImage(art.front), art.back ? loadImage(art.back) : null])

/** canvas 에 파우치를 그린다. 캔버스의 CSS 크기는 호출한 쪽이 정한다. 각도가 바뀔 때만 다시 그린다. */
export async function createPouch3D(canvas: HTMLCanvasElement, art: PouchArt, frame: PouchFrame = { box: 1, scale: 0.94 }): Promise<Pouch3D> {
  const [frontImg, backImg] = await loadArt(art)
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const s = buildScene(renderer, frontImg, backImg, frame)
  const { spin } = s
  let raf = 0
  let disposed = false

  const draw = () => {
    raf = 0
    if (disposed) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    s.size(w, h)
    s.render()
  }
  const invalidate = () => {
    if (!raf && !disposed) raf = requestAnimationFrame(draw)
  }

  const observer = new ResizeObserver(invalidate)
  observer.observe(canvas)
  draw()

  return {
    setRotation(ry, rx = 0) {
      const y = (ry * Math.PI) / 180
      const x = (-rx * Math.PI) / 180 // three 는 y 축이 위라 CSS 와 부호가 반대
      if (spin.rotation.y === y && spin.rotation.x === x) return
      // 회전 순서 XYZ — 제 몸을 먼저 돌고(ry) 그 다음 세로로 넘어간다(rx)
      spin.rotation.set(x, y, 0)
      invalidate()
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      s.dispose()
    },
  }
}

export interface StillOptions {
  /** 몸을 도는 각도(도) */
  ry?: number
  /** 캔버스 크기(px) — 화면 크기 × 2 쯤이면 레티나에서도 또렷하다 */
  width: number
  height: number
  frame?: PouchFrame
  /** 'image/png'(투명 바탕) · 'image/jpeg' · 'image/webp' */
  type?: string
  quality?: number
}

/** 멈춘 상품컷 한 장 — 같은 도안 · 각도 · 크기는 한 번만 찍는다 (카드 여러 장 · 장바구니 줄마다 WebGL 을 띄우지 않게) */
const stills = new Map<string, Promise<string>>()

export function renderPouchStill(art: PouchArt, opt: StillOptions): Promise<string> {
  const key = JSON.stringify([art.front, art.back ?? null, opt])
  let job = stills.get(key)
  if (!job) {
    job = shoot(art, opt)
    job.catch(() => stills.delete(key)) // 실패는 기억하지 않는다 — 다음에 다시
    stills.set(key, job)
  }
  return job
}

async function shoot(art: PouchArt, { ry = 0, width, height, frame = { box: 1, scale: 0.94 }, type = 'image/png', quality }: StillOptions) {
  const [frontImg, backImg] = await loadArt(art)
  const canvas = document.createElement('canvas')
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(1)
  const s = buildScene(renderer, frontImg, backImg, frame)
  try {
    s.spin.rotation.y = (ry * Math.PI) / 180
    s.size(width, height)
    s.render()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    if (!blob) throw new Error('pouch still: toBlob failed')
    return URL.createObjectURL(blob)
  } finally {
    s.dispose()
  }
}
