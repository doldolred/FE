import {
  BoxGeometry,
  CanvasTexture,
  Euler,
  Group,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three'
import { BOX_HANDOFF, BOX_HOLD } from './pouch'
import { POUCH_BODY_H, POUCH_HEIGHT, loadArt, pouchKit, studio, type PouchArt } from './pouch3d'

/**
 * 메인 마무리 장면 — 상자가 열려 있고, 흐르던 파우치가 그 안으로 들어가면 뚜껑이 닫히고, 상자가 일어서 윗면(RED BEET)을 보인다.
 * 진행(p = 0 ~ 1)은 스크롤이 정한다 (pages/HomePage). 그리는 것은 p 가 바뀔 때만.
 *
 * 파우치는 lib/pouch3d 의 부품을 그대로 쓴다 (같은 모양 · 도안 · 빛). 상자 안에는 이미 아홉 포가 비스듬히 누워 있고 가운데 한 자리가 비어 있다.
 * 넘겨받기: 화면 위를 흐르던 파우치(CSS 로 옮기는 캔버스)와 같은 자리 · 같은 크기 · 정면으로 이 장면의 파우치를 세운 뒤,
 * 흐르던 파우치를 숨긴다 — 그 뒤로는 이 장면 안에서 움직여 상자 앞벽 뒤로 가려지며 들어간다.
 *
 * 상자 인쇄는 도안 파일이 없어 참고 사진을 따라 그린다: 큰 글자 RED BEET 는 파우치 도안에서 그대로 떠내고(같은 글자꼴),
 * 작은 글씨는 확실한 것만 넣는다 (DOLDOL · 레드비트즙 · 120ml × 30포).
 *
 * 단위: 파우치 몸통 폭 = 1.
 */

// 구간 — 넘겨받기(BOX_HANDOFF · BOX_HOLD, lib/pouch) → 들어감 → 뚜껑 닫힘 → 일어서 윗면을 보임
const DROP_TO = 0.48
const LID_FROM = 0.5
const LID_TO = 0.72
const SHOW_FROM = 0.75
const SHOW_TO = 0.97

// 상자 안치수 · 골판지 두께
const BW = 5.5
const BD = 3.85
const BH = 1.2
const TH = 0.045
const OW = BW + 2 * TH
const OD = BD + 2 * TH
const FLAP = 0.55 // 뚜껑 앞에 달려 앞벽 안으로 꽂히는 날개

const rad = (deg: number) => (deg * Math.PI) / 180
const LID_OPEN = rad(104)
const FLAP_OPEN = rad(-38)
const LEAN = rad(60) // 상자 안의 파우치가 뒤로 누운 각도
const PITCH = rad(24) // 카메라가 내려다보는 각도
const FOV = 24
// 화면에서 잰 장면의 세로 길이 (단위) — 바닥 선에서 열린 뚜껑 끝까지 · 바닥 선에서 상자 앞 아랫단까지
const SCENE_UP = 5.85
const SCENE_SPAN = SCENE_UP + 0.75
const SHOW_TURN = rad(-17) // 윗면을 보일 때 옆으로 살짝 돌아 오른쪽 옆면이 보인다
const SHOW_LEAN = rad(-7) // 뒤로 살짝 기댄다

const RED = '#da1f2e'
const INK = '#222021'
const BLACK = '#1b1a1b'

/** RED BEET 글자를 떠낼 도안 — 상자 인쇄는 이 제품 것이라 상품 도안이 바뀌어도 이 파일에서 뜬다 */
const LETTERING_ART = '/products/beet/pouch-art-front.webp'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (n: number) => n * n * (3 - 2 * n)
const span = (p: number, from: number, to: number) => smooth(clamp01((p - from) / (to - from)))

function canvas2d(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** 도안에서 RED BEET 글자만 떠낸다 — 먹색 글자를 알파로 바꾸고 원하는 색을 입힌다. 글자가 있는 자리(x · y · w · h)도 같이 */
function lettering(img: HTMLImageElement, color: string, outW: number) {
  const sx = img.naturalWidth * 0.09
  const sy = img.naturalHeight * 0.17
  const sw = img.naturalWidth * 0.82
  const sh = img.naturalHeight * 0.262
  const outH = Math.round((outW * sh) / sw)
  const [c, ctx] = canvas2d(outW, outH)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH)
  const d = ctx.getImageData(0, 0, outW, outH)
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  let x0 = outW
  let x1 = 0
  let y0 = outH
  let y1 = 0
  for (let i = 0, n = 0; i < d.data.length; i += 4, n++) {
    // 빨강 채널로 가른다: 바탕(빨강) 218 → 글자(먹) 34. 가운데를 좁게 잘라 가장자리를 또렷하게
    const a = smooth(clamp01(((218 - d.data[i]) / 184 - 0.4) / 0.2))
    d.data[i] = r
    d.data[i + 1] = g
    d.data[i + 2] = b
    d.data[i + 3] = a * 255
    if (a > 0.5) {
      const x = n % outW
      const y = (n / outW) | 0
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
  }
  ctx.putImageData(d, 0, 0)
  if (x1 <= x0 || y1 <= y0) throw new Error('box lettering: nothing found')
  return { canvas: c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

function texture(c: HTMLCanvasElement, anisotropy: number) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = anisotropy
  return t
}

/** 뚜껑 윗면 — 빨강 바탕에 먹색 RED BEET (참고 사진의 닫힌 상자) */
function lidTopCanvas(art: HTMLImageElement, fontLogo: string, fontKo: string) {
  const W = 2048
  const H = Math.round((W * OD) / OW)
  const [c, ctx] = canvas2d(W, H)
  ctx.fillStyle = RED
  ctx.fillRect(0, 0, W, H)
  const L = lettering(art, INK, 1800)
  const tw = W * 0.86
  const th = (tw * L.h) / L.w
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(L.canvas, L.x, L.y, L.w, L.h, (W - tw) / 2, H * 0.535 - th / 2, tw, th)

  ctx.fillStyle = INK
  ctx.textBaseline = 'middle'
  const pad = W * 0.07
  const fs = H * 0.05
  const y = H * 0.1
  ctx.font = `800 ${fs}px ${fontLogo}`
  ctx.fillText('DOLDOL', pad, y)
  const w1 = ctx.measureText('DOLDOL').width
  ctx.fillRect(pad + w1 + fs * 0.4, y - fs * 0.42, Math.max(2, fs * 0.05), fs * 0.84)
  ctx.font = `700 ${fs * 0.9}px ${fontKo}`
  ctx.fillText('레드비트즙', pad + w1 + fs * 0.8, y + fs * 0.05)
  ctx.font = `600 ${H * 0.034}px ${fontLogo}`
  ctx.textAlign = 'right'
  ctx.fillText('120ml × 30포', W - pad, H * 0.935)
  return c
}

/** 뚜껑 안쪽 — 검정 바탕에 빨강 RED BEET, 양옆에 작은 별 (참고 사진의 열린 상자) */
function lidInnerCanvas(art: HTMLImageElement) {
  const W = 2048
  const H = Math.round((W * OD) / OW)
  const [c, ctx] = canvas2d(W, H)
  ctx.fillStyle = BLACK
  ctx.fillRect(0, 0, W, H)
  const L = lettering(art, RED, 1400)
  const tw = W * 0.5
  const th = ((tw * L.h) / L.w) * 0.62 // 눕혀 쓴 굵은 글씨처럼 낮게
  ctx.save()
  ctx.translate(W / 2, H * 0.5)
  ctx.transform(1, 0, -0.2, 1, 0, 0)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(L.canvas, L.x, L.y, L.w, L.h, -tw / 2, -th / 2, tw, th)
  ctx.restore()
  ctx.fillStyle = RED
  for (const side of [-1, 1]) {
    const cx = W / 2 + side * (tw / 2 + W * 0.055)
    const cy = H * 0.5
    const s = H * 0.035
    ctx.beginPath()
    ctx.moveTo(cx, cy - s)
    ctx.quadraticCurveTo(cx, cy, cx + s, cy)
    ctx.quadraticCurveTo(cx, cy, cx, cy + s)
    ctx.quadraticCurveTo(cx, cy, cx - s, cy)
    ctx.quadraticCurveTo(cx, cy, cx, cy - s)
    ctx.fill()
  }
  return c
}

/** 바닥에 깔리는 부드러운 그림자 */
function shadowCanvas() {
  const [c, ctx] = canvas2d(256, 256)
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.45)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return c
}

/** 글꼴이 준비된 뒤 그린다 (못 받아도 기본 글꼴로 진행) */
async function fontsReady(fontLogo: string, fontKo: string) {
  const load = Promise.all([
    document.fonts.load(`800 40px ${fontLogo}`, 'DOLDOL 120ml × 30'),
    document.fonts.load(`700 40px ${fontKo}`, '레드비트즙'),
  ])
  await Promise.race([load.catch(() => undefined), new Promise((r) => setTimeout(r, 2000))])
}

export interface BoxFrom {
  /** 흐르던 파우치(뚜껑 포함 전체)의 가운데 — 이 캔버스 왼쪽 위 기준 px */
  x: number
  y: number
  /** 파우치 전체 높이 px */
  h: number
}

export interface BoxStage {
  /**
   * p = 진행 0 ~ 1, from = 넘겨받는 자리 (없으면 마지막으로 받은 자리),
   * top = 화면 위쪽에 글이 차지한 높이(px) — 0 보다 크면 열린 뚜껑이 그 아래로 오게 상자를 줄이고 내린다
   */
  set(p: number, from: BoxFrom | null, top?: number): void
  /**
   * 넘겨받는 자리(상자 앞)에 실제 크기의 파우치를 세웠을 때 화면에 보이는 높이(px).
   * 흐르던 파우치가 이보다 작으면 상자보다 멀리 있는 셈이라, 호출한 쪽이 이만큼은 키워서 넘긴다 (아직 크기를 모르면 0)
   */
  pouchPx(): number
  dispose(): void
}

export async function createBoxStage(canvas: HTMLCanvasElement, art: PouchArt): Promise<BoxStage> {
  const css = getComputedStyle(document.documentElement)
  const fontLogo = css.getPropertyValue('--dd-font-logo').trim() || 'sans-serif'
  const fontKo = css.getPropertyValue('--dd-font-display-ko').trim() || 'sans-serif'
  const [[frontImg, backImg], [letterImg]] = await Promise.all([loadArt(art), loadArt({ front: LETTERING_ART }), fontsReady(fontLogo, fontKo)])

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  const scene = new Scene()
  const disposeStudio = studio(renderer, scene)
  const kit = pouchKit(renderer, frontImg, backImg)
  const anisotropy = renderer.capabilities.getMaxAnisotropy()

  // ── 상자 ──
  const topTex = texture(lidTopCanvas(letterImg, fontLogo, fontKo), anisotropy)
  const innerTex = texture(lidInnerCanvas(letterImg), anisotropy)
  const shadowTex = texture(shadowCanvas(), 1)
  const red = new MeshStandardMaterial({ color: RED, roughness: 0.82 })
  const rim = new MeshStandardMaterial({ color: '#b81a26', roughness: 0.9 })
  const black = new MeshStandardMaterial({ color: BLACK, roughness: 0.92 })
  const topPrint = new MeshStandardMaterial({ map: topTex, color: '#ececec', roughness: 0.82 }) // 정면으로 빛을 받아도 빨강이 뜨지 않게
  const innerPrint = new MeshStandardMaterial({ map: innerTex, roughness: 0.92 })
  const shadowMat = new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.6 })
  const geometries: BoxGeometry[] = []
  /** 판 한 장. 재질 순서: +x · -x · +y · -y · +z · -z */
  const panel = (w: number, h: number, d: number, mats: Material[], x: number, y: number, z: number) => {
    const g = new BoxGeometry(w, h, d)
    geometries.push(g)
    const m = new Mesh(g, mats)
    m.position.set(x, y, z)
    return m
  }

  const box = new Group()
  box.add(
    panel(OW, TH, OD, [red, red, black, red, red, red], 0, TH / 2, 0), // 바닥
    panel(OW, BH, TH, [red, red, rim, red, red, black], 0, TH + BH / 2, BD / 2 + TH / 2), // 앞벽
    panel(OW, BH, TH, [red, red, rim, red, black, red], 0, TH + BH / 2, -(BD / 2 + TH / 2)), // 뒷벽
    panel(TH, BH, BD, [black, red, rim, red, red, red], -(BW / 2 + TH / 2), TH + BH / 2, 0), // 왼벽
    panel(TH, BH, BD, [red, black, rim, red, red, red], BW / 2 + TH / 2, TH + BH / 2, 0), // 오른벽
  )
  // 뚜껑 — 뒷벽 위 모서리가 경첩. 0 = 닫힘, LID_OPEN = 뒤로 젖혀 열림
  const hinge = new Group()
  hinge.position.set(0, TH + BH, -OD / 2)
  hinge.add(panel(OW, TH, OD, [red, red, topPrint, innerPrint, red, red], 0, TH / 2, OD / 2))
  const flapHinge = new Group()
  flapHinge.position.set(0, 0, BD + TH - 0.012)
  flapHinge.add(panel(BW - 0.08, FLAP, TH * 0.8, [red, red, red, red, red, black], 0, -FLAP / 2, -TH * 0.4))
  hinge.add(flapHinge)
  box.add(hinge)

  // 상자 안에 누워 있는 파우치 — 앞줄 다섯 자리(가운데는 비어 있다) + 뒷줄 다섯 자리
  const slotQuat = new Quaternion().setFromEuler(new Euler(-LEAN, 0, 0))
  const slotBase = (i: number, row: number) => new Vector3((i - 2) * 1.08, TH + 0.13, BD / 2 - 0.34 - row * 1.5)
  const inside = new Group()
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      if (row === 0 && i === 2) continue
      const p = kit.create()
      p.position.y = POUCH_BODY_H / 2
      const slot = new Group()
      slot.add(p)
      slot.position.copy(slotBase(i, row))
      slot.quaternion.copy(slotQuat)
      inside.add(slot)
    }
  }
  box.add(inside)

  // 상자는 제 가운데를 축으로 일어선다
  const centerY = (BH + 2 * TH) / 2
  box.position.y = -centerY
  const rig = new Group()
  rig.add(box)
  scene.add(rig)

  const shadow = new Mesh(new PlaneGeometry(OW * 1.5, OD * 1.7), shadowMat)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.002
  scene.add(shadow)

  // 날아드는 파우치 — 원점은 파우치 전체(뚜껑 포함)의 가운데
  const fly = new Group()
  const flyBody = kit.create()
  flyBody.position.y = -(POUCH_HEIGHT - POUCH_BODY_H) / 2
  fly.add(flyBody)
  fly.visible = false
  scene.add(fly)
  /** 가운데 빈 자리에 누웠을 때의 가운데 */
  const landPos = slotBase(2, 0).add(new Vector3(0, POUCH_HEIGHT / 2, 0).applyQuaternion(slotQuat))
  const overPos = landPos.clone().add(new Vector3(0, 3.1, 0.9)) // 상자 위를 지나는 길목

  // ── 카메라 — 앞에서 조금 내려다본다. 상자 폭 · 열린 뚜껑 높이가 화면에 들어오게 거리를 잡는다 ──
  const camera = new PerspectiveCamera(FOV, 1, 0.5, 200)
  const tan = Math.tan(rad(FOV) / 2)
  const target = new Vector3()
  let cw = 0
  let ch = 0
  let topPx = 0
  let showScale = 1
  /** 넘겨받는 파우치가 설 수 있는 가장 먼 거리 — 열린 뚜껑보다 앞 (이보다 멀면 뚜껑에 가려 사라진다) */
  let frontDist = 0
  const size = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === cw && h === ch)) return
    cw = w
    ch = h
    renderer.setSize(w, h, false)
    const aspect = w / h
    const fitW = aspect < 0.8 ? 0.9 : aspect < 1.25 ? 0.76 : 0.52
    // 윗면을 보일 때 — 넓은 화면은 조금 키우고, 좁은 화면은 옆으로 돈 만큼 넘치지 않게 줄인다
    showScale = aspect < 0.8 ? 0.95 : 1.05
    const sceneH = 5.6 // 바닥 ~ 열린 뚜껑 끝
    const widthDist = OW / (fitW * 2 * tan * aspect)
    let dist: number
    /** 바닥이 화면 가운데보다 얼마나 아래에 오나 (화면 높이 비율) */
    let floor: number
    if (topPx > 0) {
      // 위에 글이 있는 배치 — 열린 뚜껑 끝이 글 아래로, 상자 앞 아랫단이 아래 여백 위로 오게 맞춘다
      const avail = Math.max(h * 0.4, h * 0.92 - topPx)
      dist = Math.max(widthDist, (SCENE_SPAN * h) / (avail * 2 * tan))
      const unit = h / (2 * dist * tan) // 1 단위가 화면에서 몇 px 인가
      floor = (topPx + (avail - SCENE_SPAN * unit) / 2 + SCENE_UP * unit) / h - 0.5
    } else {
      dist = Math.max(widthDist, sceneH / (0.62 * 2 * tan))
      floor = Math.min(0.27, (0.5 * sceneH * 0.86) / (2 * dist * tan) + 0.07)
    }
    const viewH = 2 * dist * tan
    frontDist = dist - 2.5
    target.set(0, (floor * viewH) / Math.cos(PITCH), 0)
    camera.aspect = aspect
    camera.position.set(0, target.y + Math.sin(PITCH) * dist, Math.cos(PITCH) * dist)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    // 윗면을 보일 때의 자세 — 윗면이 카메라를 마주 보고(글자 위쪽 = 화면 위쪽), 거기서 살짝 돌고 기댄다
    showQuat.copy(camera.quaternion).multiply(showTurn).multiply(faceUp)
  }
  const showQuat = new Quaternion()
  const showTurn = new Quaternion().setFromEuler(new Euler(SHOW_LEAN, SHOW_TURN, 0, 'YXZ'))
  const faceUp = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0))
  const upright = new Quaternion()

  const fwd = new Vector3()
  const right = new Vector3()
  const up = new Vector3()
  const startPos = new Vector3()
  const a = new Vector3()
  const b = new Vector3()
  let from: BoxFrom | null = null
  let disposed = false

  return {
    set(p, nextFrom, top = 0) {
      if (disposed) return
      if (top !== topPx) {
        topPx = top
        cw = 0 // 자리를 다시 잡는다
      }
      size()
      if (!cw) return
      if (nextFrom) from = nextFrom

      // 뚜껑
      const open = 1 - span(p, LID_FROM, LID_TO)
      hinge.rotation.x = -LID_OPEN * open
      flapHinge.rotation.x = FLAP_OPEN * open

      // 닫힌 뒤 — 일어서며 윗면을 보인다
      const show = span(p, SHOW_FROM, SHOW_TO)
      rig.quaternion.slerpQuaternions(upright, showQuat, show)
      rig.position.set(0, centerY + (target.y + 0.15 - centerY) * show, 0.6 * show)
      rig.scale.setScalar(1 + (showScale - 1) * show)
      shadowMat.opacity = 0.6 * (1 - 0.7 * show)
      shadow.scale.setScalar(1 - 0.25 * show)
      inside.visible = open > 0

      // 파우치 — 넘겨받은 자리에서 상자 위를 지나 빈 자리로
      fly.visible = p >= BOX_HANDOFF && open > 0 && !!from
      if (fly.visible && from) {
        camera.getWorldDirection(fwd)
        right.setFromMatrixColumn(camera.matrixWorld, 0)
        up.setFromMatrixColumn(camera.matrixWorld, 1)
        // 화면에서 같은 크기로 보이는 거리. 뚜껑보다 뒤가 되면 뚜껑 앞에 세우고, 그만큼 줄여서 같은 크기로 보이게 한다
        const far = (ch * POUCH_HEIGHT) / (2 * from.h * tan)
        const d = Math.min(far, frontDist)
        const startScale = d / far
        const nx = (from.x / cw) * 2 - 1
        const ny = 1 - (from.y / ch) * 2
        startPos
          .copy(camera.position)
          .addScaledVector(fwd, d)
          .addScaledVector(right, nx * d * tan * camera.aspect)
          .addScaledVector(up, ny * d * tan)
        const t = span(p, BOX_HANDOFF + BOX_HOLD, DROP_TO)
        a.lerpVectors(startPos, overPos, t)
        b.lerpVectors(overPos, landPos, t)
        fly.position.lerpVectors(a, b, t)
        fly.quaternion.slerpQuaternions(camera.quaternion, slotQuat, smooth(clamp01((t - 0.12) / 0.7)))
        fly.scale.setScalar(startScale + (1 - startScale) * t)
      }
      renderer.render(scene, camera)
    },
    pouchPx() {
      size()
      return frontDist > 0 ? (ch * POUCH_HEIGHT) / (2 * frontDist * tan) : 0
    },
    dispose() {
      disposed = true
      kit.dispose()
      disposeStudio()
      for (const g of geometries) g.dispose()
      shadow.geometry.dispose()
      for (const m of [red, rim, black, topPrint, innerPrint, shadowMat]) m.dispose()
      for (const t of [topTex, innerTex, shadowTex]) t.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
