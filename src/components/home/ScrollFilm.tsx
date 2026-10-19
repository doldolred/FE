import { useEffect, useRef, type ReactNode } from 'react'
import { FILM } from '../../data/story'
import { progressOf, useReducedMotion, useScrollStep } from '../../lib/useScroll'
import Scene from './Scene'

/**
 * 스크롤 필름 = 메인의 첫 화면. 긴 무대를 내려가는 동안 화면은 붙잡혀 있고 장면이 스크롤에 맞춰 넘어간다.
 *   첫 구간   히어로(hero) — 큰 표제 · 구매 버튼 · 목차
 *   다음부터  문장 하나씩(FILM.frames)
 *
 * 영상 대신 사진 묶음(FILM.sequence)을 캔버스에 그린다 — 영상의 currentTime 을 스크롤마다 바꾸면 끊긴다.
 * React 는 구간이 바뀔 때만 다시 그리고(useScrollStep), 사진 · 진행 막대는 rAF 안에서 직접 칠한다.
 * 움직임을 줄인 사용자에게는 무대를 붙잡지 않고 히어로 아래에 문장들을 펼친다.
 */
export default function ScrollFilm({ hero }: { hero: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const bars = useRef<(HTMLSpanElement | null)[]>([])
  const reduced = useReducedMotion()
  const frames = FILM.frames
  const seq = FILM.sequence
  const phases = frames.length + 1
  const phase = useScrollStep(stage, (p) => Math.min(phases - 1, Math.floor(p * phases)))
  const onHero = phase === 0
  const active = phase - 1

  useEffect(() => {
    if (reduced) return
    const el = stage.current
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    if (!el) return

    // 사진 묶음 — 첫 장은 바로, 나머지는 차례로 받는다. 아직 안 온 장은 가장 가까운 받은 장으로 그린다
    const images: (HTMLImageElement | null)[] = seq ? new Array(seq.count).fill(null) : []
    let alive = true
    let drawn = -1
    let frame = 0

    const src = (i: number) => `${seq!.base}${String(i + 1).padStart(seq!.pad, '0')}${seq!.ext}`
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < images.length; d++) {
        if (images[i - d]?.complete) return images[i - d]!
        if (images[i + d]?.complete) return images[i + d]!
      }
      return null
    }

    function size() {
      if (!cv) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      cv.width = Math.round(window.innerWidth * dpr)
      cv.height = Math.round(window.innerHeight * dpr)
      drawn = -1
    }

    function draw(i: number) {
      if (!ctx || !cv) return
      const img = images[i]?.complete ? images[i]! : nearestLoaded(i)
      if (!img || !img.naturalWidth) return
      // object-fit: cover
      const scale = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h)
      drawn = i
    }

    function update() {
      frame = 0
      const p = progressOf(el)
      if (seq) {
        const i = Math.min(seq.count - 1, Math.round(p * (seq.count - 1)))
        if (i !== drawn) draw(i)
      }
      // 진행 막대 — 문장 구간(둘째 구간부터)만큼 차오른다
      bars.current.forEach((bar, k) => {
        if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, p * phases - 1 - k))})`
      })
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const onResize = () => {
      size()
      update()
    }

    if (seq) {
      size()
      const load = (i: number) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = img.onerror = () => {
            images[i] = img
            resolve()
          }
          img.src = src(i)
        })
      // 첫 장 → 그리기 → 나머지는 여섯 장씩 나눠 받는다
      load(0).then(async () => {
        if (!alive) return
        update()
        for (let i = 1; i < seq.count && alive; i += 6) {
          await Promise.all(Array.from({ length: Math.min(6, seq.count - i) }, (_, k) => load(i + k)))
          if (alive && drawn !== -1) update()
        }
      })
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      alive = false
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced, seq, phases])

  if (reduced) {
    return (
      <Scene id="film" label="돌돌 비트즙" bare>
        <div className="relative flex min-h-svh items-end overflow-hidden">
          <Backdrop />
          <div className="relative z-10 w-full">{hero}</div>
        </div>
        <div className="mx-auto flex max-w-5xl flex-col gap-16 px-5 py-28 md:px-10">
          {frames.map((f) => (
            <div key={f.eyebrow}>
              <p className="text-xs font-semibold tracking-[0.3em] text-beet-300">{f.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-extrabold text-cream md:text-5xl">{f.title}</h2>
              <p className="mt-4 max-w-[46ch] text-cream/70">{f.body}</p>
            </div>
          ))}
        </div>
      </Scene>
    )
  }

  return (
    <Scene id="film" label="돌돌 비트즙" bare>
      <div ref={stage} style={{ height: `${phases * 90 + 100}svh` }}>
        <div className="sticky top-0 h-svh overflow-hidden">
          <Backdrop />
          {seq && <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />}

          {/* 히어로 — 첫 구간에만 보인다. 사라져도 자리를 지킨다(투명 · 클릭 막음) */}
          <div
            aria-hidden={!onHero}
            inert={!onHero}
            className={`absolute inset-x-0 bottom-0 z-10 transition-[opacity,transform] duration-700 ease-soft ${onHero ? 'opacity-100' : 'pointer-events-none -translate-y-6 opacity-0'}`}
          >
            {hero}
          </div>

          {/* 문장 — 둘째 구간부터. key 가 바뀌면 다시 떠오른다 */}
          {!onHero && (
            <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-end px-5 pb-20 md:px-10 md:pb-24">
              <div key={active} className="film-caption max-w-xl" aria-live="polite">
                <p className="text-xs font-semibold tracking-[0.3em] text-beet-300">{frames[active].eyebrow}</p>
                <h2 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-tight break-keep text-cream md:text-6xl">
                  {frames[active].title}
                </h2>
                <p className="mt-5 text-base leading-relaxed text-cream/75 md:text-lg">{frames[active].body}</p>
              </div>
            </div>
          )}

          {/* 히어로에서는 "SCROLL", 그다음부터는 문장 수만큼의 진행 선 */}
          <div
            aria-hidden="true"
            className={`scroll-cue absolute right-5 bottom-8 z-10 hidden flex-col items-center text-[0.65rem] tracking-[0.3em] text-cream/50 md:right-10 ${onHero ? 'md:flex' : ''}`}
          >
            SCROLL
          </div>
          <div aria-hidden="true" className={`absolute right-5 bottom-8 z-10 flex gap-2 md:right-10 ${onHero ? 'invisible' : ''}`}>
            {frames.map((f, i) => (
              <span key={f.eyebrow} className="relative block h-px w-10 overflow-hidden bg-cream/20">
                <span
                  ref={(node) => {
                    bars.current[i] = node
                  }}
                  className="absolute inset-y-0 left-0 w-full origin-left bg-beet-300"
                  style={{ transform: 'scaleX(0)' }}
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </Scene>
  )
}

/** 정지 사진 — 있으면 사진, 없으면 비트색 그라데이션 + 무엇을 찍어 넣을지 */
function Backdrop() {
  if (FILM.poster) {
    return (
      <img
        src={FILM.poster}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(circle at 68% 38%, rgba(214,51,108,0.55) 0%, rgba(142,27,74,0.35) 22%, transparent 48%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(92,18,49,0.6) 0%, transparent 70%), linear-gradient(180deg, #1d0f15 0%, #140a0e 100%)',
      }}
    >
      {/* 비트 단면 — 촬영본이 오기 전 자리 */}
      <div aria-hidden="true" className="hero-glow absolute top-[18%] right-[8%] aspect-square w-[min(56vw,560px)] rounded-full beet-slice" />
      <span className="absolute top-24 right-5 text-[0.6rem] tracking-[0.3em] text-cream/40 md:right-10">
        VIDEO · {FILM.shotHint}
      </span>
    </div>
  )
}
