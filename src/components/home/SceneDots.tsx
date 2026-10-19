import { useEffect, useState } from 'react'

/**
 * 장(章) 점 — 오른쪽 가운데에 세로로. 화면 한가운데를 지나는 장이 켜진다. 누르면 그 장으로 부드럽게 간다.
 * 왼쪽 아래에는 지금 장의 번호 · 이름("02 / 05 — 과정"). 폰에서는 둘 다 숨긴다 — 엄지 자리와 겹친다.
 */
export default function SceneDots() {
  const [scenes, setScenes] = useState<{ id: string; label: string }[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>('main [data-scene]')]
    els.forEach((el, i) => {
      if (!el.id) el.id = `scene-${i + 1}`
    })
    // effect 안에서 바로 setState 하지 않고 다음 프레임에
    const frame = requestAnimationFrame(() =>
      setScenes(els.map((el) => ({ id: el.id, label: el.getAttribute('aria-label') ?? '' }))),
    )
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement))
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    els.forEach((el) => io.observe(el))
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
    }
  }, [])

  if (scenes.length === 0) return null
  // 첫 장면(히어로)은 장이 아니다 — 표시는 그 다음부터
  const current = scenes[active]
  const chapters = scenes.length - 1
  return (
    <>
      {active > 0 && (
        <p
          aria-live="polite"
          className="fixed bottom-9 left-10 z-40 hidden items-baseline gap-3 text-[0.65rem] tracking-[0.3em] text-cream/50 md:flex"
        >
          <span className="text-base font-bold text-beet-300 tabular-nums">{String(active).padStart(2, '0')}</span>
          <span className="opacity-60">/ {String(chapters).padStart(2, '0')}</span>
          <span className="mx-1 inline-block h-px w-6 -translate-y-1 bg-cream/30" aria-hidden="true" />
          <span key={current.id} className="step-numeral">
            {current.label}
          </span>
        </p>
      )}
      <nav aria-label="장" className="fixed top-1/2 right-6 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
        {scenes.map((s, i) => {
          const on = i === active
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={on ? 'true' : undefined}
              aria-label={`${i + 1}. ${s.label}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="group flex min-h-6 items-center gap-3"
            >
              <span
                className={`text-[0.6rem] tracking-[0.3em] transition-opacity duration-500 ${on ? 'text-beet-300 opacity-100' : 'text-cream/50 opacity-0 group-hover:opacity-100'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`scene-dot block h-px ${on ? 'w-8 bg-beet-300' : 'w-4 bg-cream/30 group-hover:bg-cream/60'}`} />
            </a>
          )
        })}
      </nav>
    </>
  )
}
