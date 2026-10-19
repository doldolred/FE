import type { ReactNode } from 'react'
import Line from './Line'
import Scene from './Scene'

/**
 * 이야기의 장(章) — 왼쪽은 장 번호 · 표제가 붙잡혀 있고(sticky), 오른쪽 내용이 그 옆을 흘러 지나간다.
 * 읽는 길이만큼 길어진다. 오른쪽 항목에 .scrub-in 을 달면 스크롤에 따라 하나씩 밝아진다.
 */
export default function Chapter({
  id,
  n,
  en,
  label,
  title,
  children,
  className = '',
}: {
  id: string
  /** "01" 처럼 두 자리 */
  n: string
  en: string
  label: string
  /** 표제 줄들 */
  title: ReactNode[]
  children: ReactNode
  className?: string
}) {
  return (
    <Scene id={id} label={label} bare className={`chapter ${className}`}>
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-28 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20 md:px-10 md:py-44">
        <header className="md:sticky md:top-32 md:self-start">
          <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-beet-300">
            <span className="text-lg tabular-nums">{n}</span>
            <span className="mx-3 inline-block h-px w-8 -translate-y-1 bg-current opacity-60" aria-hidden="true" />
            {en}
          </p>
          <h2 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight break-keep text-cream md:text-6xl">
            {title.map((t, i) => (
              <Line key={i} i={i}>
                {t}
              </Line>
            ))}
          </h2>
        </header>
        <div className="min-w-0">{children}</div>
      </div>
    </Scene>
  )
}
