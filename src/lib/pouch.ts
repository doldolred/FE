/** 3D 그림 파우치(components/lineup/SvgPouch) 자세 — 스크롤 · 드래그마다 React 렌더 없이 스타일만 바꾼다 (v4 원본과 같음) */

export interface PouchPose {
  x?: number
  y?: number
  /** 기울기(도) */
  rz?: number
  /** 몸을 도는 각도(도) — 180 이면 뒷면 */
  ry?: number
  sc?: number
}

export function posePouch(el: HTMLElement | null, { x = 0, y = 0, rz = 0, ry = 0, sc = 1 }: PouchPose) {
  if (!el) return
  const body = el.firstElementChild as HTMLElement
  body.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotateZ(${rz.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(3)})`
  // 각도에 따른 빛 — 앞면이 보일수록 앞면이 밝고, 반사광이 몸을 가로질러 지나간다
  const rad = (ry * Math.PI) / 180
  const c = Math.cos(rad)
  el.style.setProperty('--lf', (0.7 + 0.38 * Math.max(0, c)).toFixed(3))
  el.style.setProperty('--lb', (0.7 + 0.38 * Math.max(0, -c)).toFixed(3))
  el.style.setProperty('--sx', `${(50 - Math.sin(rad) * 70).toFixed(1)}%`)
}
