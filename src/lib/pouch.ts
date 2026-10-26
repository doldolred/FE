/** 사진 파우치(components/lineup/PhotoPouch) 자세 — 스크롤 · 드래그마다 React 렌더 없이 스타일만 바꾼다 */

export interface PouchPose {
  x?: number
  y?: number
  /** 기울기(도) */
  rz?: number
  /** 몸을 도는 각도(도) — 사진이라 뒷면은 없다. sin 으로 좌우 ±로 바꿔 각도 사진을 고르고 살짝 돌린다 */
  ry?: number
  sc?: number
}

const TURN = 24 // 사진을 실제로 돌리는 최대 각도
const PICK = 0.38 // 이보다 더 돌면 옆 각도 사진

export function posePouch(el: HTMLElement | null, { x = 0, y = 0, rz = 0, ry = 0, sc = 1 }: PouchPose) {
  if (!el) return
  const body = el.firstElementChild as HTMLElement
  const rad = (ry * Math.PI) / 180
  const s = Math.sin(rad)
  const pick = s < -PICK ? 'left' : s > PICK ? 'right' : 'front'
  if (el.dataset.pick !== pick) el.dataset.pick = pick
  body.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rz.toFixed(2)}deg) rotateY(${(s * TURN).toFixed(2)}deg) scale(${sc.toFixed(3)})`
  el.style.setProperty('--lf', (0.86 + 0.14 * Math.abs(Math.cos(rad))).toFixed(3))
  el.style.setProperty('--sx', `${(50 - s * 70).toFixed(1)}%`)
}
