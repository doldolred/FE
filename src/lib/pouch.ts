/**
 * 파우치(components/lineup/SvgPouch) 자세 — 스크롤 · 드래그마다 React 렌더 없이 스타일만 바꾼다 (v4 원본과 같음).
 * 파우치는 두 가지로 그려진다: CSS 그림 파우치(먼저 뜬다) → WebGL 입체 파우치(lib/pouch3d, 준비되면 바뀐다).
 * 어느 쪽이든 자세는 여기 posePouch 하나로 준다.
 */

export interface PouchPose {
  x?: number
  y?: number
  /** 기울기(도) */
  rz?: number
  /** 몸을 도는 각도(도) — 180 이면 뒷면 */
  ry?: number
  /** 세로로 넘어가는 각도(도, 가로축 회전) — 360 이면 한 바퀴 돌아 다시 바로 선다 */
  rx?: number
  sc?: number
}

/**
 * WebGL 캔버스 안에서 파우치가 놓이는 자리 — 캔버스가 파우치 상자(.dd-pouch)보다 위아래로 15% 씩 넉넉하고(box),
 * 파우치 전체 높이(뚜껑 포함)는 상자 높이의 1.08 배(scale), 바닥은 상자 바닥에 닿는다.
 */
export const POUCH_GL_FRAME = { box: 1 / 1.3, scale: 1.08 }

/** 메인 마무리의 상자 연출(lib/box3d) — 진행 p 가 여기에 이르면 흐르던 파우치를 상자 장면이 넘겨받고, HOLD 동안 흐르던 파우치가 사라진다 */
export const BOX_HANDOFF = 0.1
export const BOX_HOLD = 0.03

/** WebGL 파우치가 붙은 요소 → 도는 각도를 받는 함수 */
const live3d = new WeakMap<HTMLElement, (ry: number, rx: number) => void>()
const lastPose = new WeakMap<HTMLElement, PouchPose>()

export function posePouch(el: HTMLElement | null, pose: PouchPose) {
  if (!el) return
  lastPose.set(el, pose)
  const { x = 0, y = 0, rz = 0, ry = 0, rx = 0, sc = 1 } = pose
  const body = el.firstElementChild as HTMLElement
  const move = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rz.toFixed(2)}deg)`
  const turn3d = live3d.get(el)
  if (turn3d) {
    // 입체 파우치: 도는 것은 모델이 하고(빛도 모델이), 요소는 옮기고 기울이고 키우기만
    body.style.transform = `${move} scale(${sc.toFixed(3)})`
    turn3d(ry, rx)
    return
  }
  body.style.transform = `${move} rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`
  // 각도에 따른 빛 — 앞면이 보일수록 앞면이 밝고, 반사광이 몸을 가로질러 지나간다
  const rad = (ry * Math.PI) / 180
  const c = Math.cos(rad) * Math.cos((rx * Math.PI) / 180)
  el.style.setProperty('--lf', (0.7 + 0.38 * Math.max(0, c)).toFixed(3))
  el.style.setProperty('--lb', (0.7 + 0.38 * Math.max(0, -c)).toFixed(3))
  el.style.setProperty('--sx', `${(50 - Math.sin(rad) * 70).toFixed(1)}%`)
}

/** WebGL 파우치를 붙이거나(turn) 뗀다(null) — 지금 자세를 그대로 이어받는다 */
export function attachPouch3D(el: HTMLElement, turn: ((ry: number, rx: number) => void) | null) {
  if (turn) live3d.set(el, turn)
  else live3d.delete(el)
  posePouch(el, lastPose.get(el) ?? {})
}
