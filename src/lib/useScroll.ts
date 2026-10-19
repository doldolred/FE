import { useSyncExternalStore, type RefObject } from 'react'

/**
 * 스크롤 · 환경 상태를 useSyncExternalStore 로 읽는다.
 * effect 안에서 setState 하는 대신 외부 저장소로 읽어서, 첫 렌더부터 값이 맞고 린트에도 걸리지 않는다.
 */

const subscribeScroll = (cb: () => void) => {
  window.addEventListener('scroll', cb, { passive: true })
  window.addEventListener('resize', cb)
  // 새로고침으로 중간에 열렸을 때 첫 스크롤 전에도 한 번 맞춘다
  const frame = requestAnimationFrame(cb)
  return () => {
    window.removeEventListener('scroll', cb)
    window.removeEventListener('resize', cb)
    cancelAnimationFrame(frame)
  }
}

/** 화면 높이의 fraction 배만큼 내려갔는가 — 투명 헤더가 굳는 시점 */
export function useScrolledPast(fraction: number): boolean {
  return useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > window.innerHeight * fraction,
    () => false,
  )
}

/** 긴 무대(el)를 지나는 동안 0 → 1. 무대 높이에서 화면 높이를 뺀 만큼이 구간이다. */
export function progressOf(el: HTMLElement | null): number {
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const range = rect.height - window.innerHeight
  if (range <= 0) return 0
  return Math.min(1, Math.max(0, -rect.top / range))
}

/**
 * 진행을 정수 단계로 바꿔 읽는다 — 단계가 바뀔 때만 다시 그린다.
 * (0.001 단위 진행을 그대로 state 로 쓰면 스크롤 한 번에 수십 번 렌더된다)
 */
export function useScrollStep(ref: RefObject<HTMLElement | null>, map: (progress: number) => number): number {
  return useSyncExternalStore(
    subscribeScroll,
    () => map(progressOf(ref.current)),
    () => 0,
  )
}

const REDUCED = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const media = window.matchMedia(REDUCED)
      media.addEventListener('change', cb)
      return () => media.removeEventListener('change', cb)
    },
    () => window.matchMedia(REDUCED).matches,
    () => false,
  )
}
