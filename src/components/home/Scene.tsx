import { useEffect, useRef, type ReactNode } from 'react'

/**
 * 메인의 장면 하나. 화면에 충분히 들어오면 data-active="true" 가 붙고 [data-reveal] · .line 자식이 나타난다(index.css).
 * 한 번 켜지면 다시 숨기지 않는다 — 위로 올라갔다 내려와도 깜빡이지 않게.
 *
 * bare: 한 화면 크기 · overflow 숨김(.scene)을 붙이지 않는다 — 화면보다 긴 무대를 sticky 로 쓰는 장면용
 * (overflow:hidden 인 조상 안에서는 sticky 가 멈춘다).
 */
export default function Scene({
  id,
  label,
  bare = false,
  className = '',
  children,
}: {
  id?: string
  label?: string
  bare?: boolean
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || document.documentElement.dataset.motion !== 'on') return
    // 기준은 "화면의 40%". 장면이 화면보다 훨씬 길면 화면 기준으로 환산한다
    const threshold = Math.min(0.4, (window.innerHeight * 0.4) / Math.max(1, el.offsetHeight))
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.active = 'true'
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} id={id} aria-label={label} data-scene="" className={`${bare ? 'relative' : 'scene'} ${className}`}>
      {children}
    </section>
  )
}
