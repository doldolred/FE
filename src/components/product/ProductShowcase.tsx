import { useCallback, useState, type CSSProperties } from 'react'
import { activeFeature, type Showcase } from '../../data/showcase'
import Turntable from './Turntable'

interface Props {
  name: string
  showcase: Showcase
  /** 특징 목록을 보일지 (상품 상세에서만) */
  withFeatures?: boolean
  className?: string
}

/**
 * 어두운 무대 위의 360° 상품 — 뒤에 큰 영문 이름이 깔리고, 돌리면 각도에 맞는 특징이 켜진다.
 * 사진 묶음이 아직 없으면 정지 사진 + 특징 전부 켜짐. 각도 사진(angles)이 있으면 아래 버튼으로 바꿔 본다.
 */
export default function ProductShowcase({ name, showcase, withFeatures = false, className = '' }: Props) {
  const [active, setActive] = useState(0)
  const [angle, setAngle] = useState(0)
  const hasFrames = showcase.turntable !== null
  const angles = hasFrames ? [] : showcase.angles

  const onFrame = useCallback(
    (index: number, count: number) => {
      const next = activeFeature(showcase.features, index / count)
      setActive((prev) => (prev === next ? prev : next))
    },
    [showcase.features],
  )

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-ink text-cream ${className}`}
      style={{ '--accent': showcase.accent } as CSSProperties}
    >
      {/* 빛 — 강조색으로 은은하게 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 60% at 50% 55%, color-mix(in srgb, var(--accent) 28%, transparent) 0%, transparent 70%)`,
        }}
      />
      {/* 뒤에 깔리는 큰 글자 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[22vw] leading-none font-extrabold tracking-tighter text-cream/[0.06] select-none md:text-[11rem]"
      >
        {showcase.wordmark}
      </span>

      <div className={`relative grid gap-8 p-6 md:p-10 ${withFeatures ? 'md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : ''}`}>
        <div className="relative aspect-square w-full md:aspect-[4/5]">
          {angles.length > 0 ? (
            angles.map((a, i) => (
              <img
                key={a.src}
                src={a.src}
                alt={i === angle ? `${name} — ${a.label}` : ''}
                aria-hidden={i === angle ? undefined : true}
                className={`absolute inset-0 h-full w-full object-contain pb-10 transition-opacity duration-500 ease-soft ${i === angle ? 'opacity-100' : 'opacity-0'}`}
              />
            ))
          ) : (
            <Turntable frames={showcase.turntable} poster={showcase.poster} alt={name} onFrame={onFrame} />
          )}
          {angles.length > 1 && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2" role="group" aria-label="각도">
              {angles.map((a, i) => (
                <button
                  key={a.src}
                  type="button"
                  aria-pressed={i === angle}
                  onClick={() => setAngle(i)}
                  onMouseEnter={() => setAngle(i)}
                  className={`min-h-8 rounded-full border px-3 text-xs transition-colors ${
                    i === angle ? 'border-[var(--accent)] text-cream' : 'border-cream/20 text-cream/50 hover:text-cream'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
          {hasFrames && (
            <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[0.65rem] tracking-[0.3em] text-cream/40">
              ← 끌어서 돌려 보세요 →
            </p>
          )}
        </div>

        {withFeatures && (
          <ol className="flex flex-col justify-center gap-5 md:gap-7">
            {showcase.features.map((f, i) => {
              const lit = !hasFrames || i === active
              return (
                <li
                  key={f.title}
                  className={`border-l-2 pl-4 transition-[opacity,border-color] duration-500 ease-soft ${lit ? 'opacity-100' : 'opacity-30'}`}
                  style={{ borderColor: lit ? 'var(--accent)' : 'transparent' }}
                >
                  <p className="text-lg font-bold md:text-xl">{f.title}</p>
                  <p className="mt-1 text-sm text-cream/70">{f.body}</p>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
