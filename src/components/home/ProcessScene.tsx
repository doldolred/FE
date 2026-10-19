import { useRef, type CSSProperties } from 'react'
import { PROCESS } from '../../data/story'
import { useReducedMotion, useScrollStep } from '../../lib/useScroll'
import Scene from './Scene'

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

/**
 * 만드는 과정 — 긴 무대(단계 수 × 45svh)를 스크롤하는 동안 화면은 붙잡혀 있고, 진행 막대가 차오르며
 * 단계가 하나씩 켜진다. 움직임을 줄인 사용자에게는 한 번에 펼친다.
 */
export default function ProcessScene() {
  const stage = useRef<HTMLDivElement>(null)
  const active = useScrollStep(stage, (p) => Math.min(PROCESS.length - 1, Math.floor(p * PROCESS.length)))
  const reduced = useReducedMotion()
  const progress = (active + 1) / PROCESS.length
  const step = PROCESS[active]

  return (
    <Scene id="process" label="과정" bare>
      <div ref={stage} style={{ height: reduced ? 'auto' : `${PROCESS.length * 45 + 100}svh` }}>
        <div
          className={`${reduced ? '' : 'sticky top-0 h-svh'} relative flex flex-col justify-center overflow-hidden px-5 py-16 md:px-10 md:py-24`}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 70% at 85% 30%, rgba(142,27,74,0.35) 0%, transparent 60%), linear-gradient(180deg, #140a0e 0%, #1a0c12 100%)',
            }}
          />
          {!reduced && (
            <span
              key={step.key}
              aria-hidden="true"
              className="step-numeral pointer-events-none absolute right-[-0.05em] bottom-[-0.1em] text-[38vw] leading-none font-extrabold text-beet-300/10 select-none md:text-[26rem]"
            >
              {String(active + 1).padStart(2, '0')}
            </span>
          )}
          <div className="relative mx-auto w-full max-w-6xl">
            <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-beet-300">
              02 — PROCESS
            </p>
            <h2 data-reveal style={delay(120)} className="mt-3 text-3xl font-extrabold tracking-tight text-cream md:text-5xl">
              밭에서 한 포가 되기까지
            </h2>

            <div data-reveal style={delay(240)} className="relative mt-8 h-px w-full bg-cream/20 md:mt-10">
              <div
                className="process-track absolute inset-y-0 left-0 w-full bg-beet-300"
                style={{ '--progress': reduced ? 1 : progress } as CSSProperties}
              />
            </div>

            <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
              <ol className="flex flex-col gap-2 md:gap-3">
                {PROCESS.map((s, i) => {
                  const on = reduced || i <= active
                  const now = !reduced && i === active
                  return (
                    <li
                      key={s.key}
                      className={`flex items-baseline gap-4 transition-opacity duration-500 ease-soft md:gap-5 ${on ? 'opacity-100' : 'opacity-30'}`}
                    >
                      <span className={`text-base tabular-nums md:text-xl ${now ? 'text-beet-300' : 'text-cream/40'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`font-bold transition-[font-size,color] duration-500 ease-soft ${now ? 'text-2xl text-cream md:text-4xl' : 'text-lg text-cream/70 md:text-2xl'}`}
                      >
                        {s.title}
                      </span>
                      <span className="ml-auto hidden text-[0.65rem] tracking-[0.3em] text-cream/40 md:block">{s.en}</span>
                    </li>
                  )
                })}
              </ol>

              {reduced ? (
                <dl className="flex flex-col gap-6">
                  {PROCESS.map((s) => (
                    <div key={s.key}>
                      <dt className="font-semibold text-cream">{s.title}</dt>
                      <dd className="mt-1 text-sm text-cream/70">{s.body}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div key={step.key} className="film-caption border-cream/15 md:border-l md:pl-12">
                  <p className="text-[0.65rem] tracking-[0.3em] text-cream/40">{step.en}</p>
                  <p className="mt-3 text-base leading-relaxed text-cream md:mt-4 md:text-xl" aria-live="polite">
                    {step.body}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Scene>
  )
}
