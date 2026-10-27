import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/products'
import { queryKeys } from '../../api/queryKeys'
import { SELLING, UPCOMING, pageColors, type ProductColors } from '../../data/lineup'
import { formatPrice } from '../../lib/format'
import { posePouch } from '../../lib/pouch'
import { useReducedMotion } from '../../lib/useScroll'
import { ProductArt } from './Art'
import SvgPouch from './SvgPouch'

/**
 * 상세 페이지 바탕 (v4-product) — 제품 색을 변수로 깔고, 헤더도 같은 바탕이 되게 html 에 알린다.
 * 화면 전체 폭 (Layout 이 이 경로들은 폭 제한을 두지 않는다).
 */
export function ProductPage({ colors, children }: { colors: ProductColors; children: ReactNode }) {
  const vars = pageColors(colors)
  const { bg, dark } = colors
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--dd-page-bg', bg)
    root.setProperty('--dd-page-fg', dark ? '#fff' : '#16173d')
    root.setProperty('--dd-page-line', 'transparent')
    return () => {
      root.removeProperty('--dd-page-bg')
      root.removeProperty('--dd-page-fg')
      root.removeProperty('--dd-page-line')
    }
  }, [bg, dark])
  return (
    <div className="dd-pd" style={vars as CSSProperties}>
      {children}
    </div>
  )
}

/** 무대 — 제품 색 판 · 굵은 테두리 · 뒤에 영문 이름 · 왼쪽 위 상태 뱃지 */
export function Stage({ badge, word, children }: { badge: string; word: string; children: ReactNode }) {
  return (
    <div className="dd-stage">
      <span className="badge">{badge}</span>
      <div className="word" aria-hidden="true">
        {word}
      </div>
      {children}
    </div>
  )
}

/** 무대 위 파우치 — 끌어서 돌리고, 놓으면 관성 → 천천히 혼자 돈다 (v4-product 원본과 같은 움직임) */
export function SpinPouch({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const pouchRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const art = ref.current
    const pouch = pouchRef.current
    if (!art || !pouch) return
    let ry = -20
    let vel = 0
    let dragging = false
    let lastX = 0
    let raf = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      art.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      ry += dx * 0.6
      vel = dx * 0.6
    }
    const up = () => {
      dragging = false
    }
    const tick = (now: number) => {
      if (!dragging) {
        vel *= 0.94
        ry += vel + (reduced ? 0 : 0.25)
      }
      posePouch(pouch, { y: reduced ? 0 : Math.sin(now / 900) * 8, rz: Math.sin(now / 1400) * 3, ry })
      raf = requestAnimationFrame(tick)
    }
    art.addEventListener('pointerdown', down)
    art.addEventListener('pointermove', move)
    art.addEventListener('pointerup', up)
    art.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      art.removeEventListener('pointerdown', down)
      art.removeEventListener('pointermove', move)
      art.removeEventListener('pointerup', up)
      art.removeEventListener('pointercancel', up)
    }
  }, [reduced])

  return (
    <>
      <span className="spin-hint">← 끌어서 돌려 보세요 →</span>
      <div className="art" data-art="pouch" ref={ref}>
        <SvgPouch ref={pouchRef} label={label} />
      </div>
    </>
  )
}

const TILT = ['-3deg', '2deg', '-1deg']

/** 비스듬한 스티커 줄 */
export function Points({ items }: { items: string[] }) {
  return (
    <ul className="dd-points">
      {items.map((t, i) => (
        <li key={t} style={{ '--r': TILT[i % 3] } as CSSProperties}>
          {t}
        </li>
      ))}
    </ul>
  )
}

const cardColors = (c: ProductColors) =>
  ({ '--c-bg': c.bg, '--c-fg': c.dark ? '#fff' : '#16173d', '--c-stage': c.stage }) as CSSProperties

/** MORE FROM DOLDOL — 지금 보는 것 말고 다른 제품 카드 (제품마다 제 색) */
export function MoreFromDoldol({ exceptProductId, exceptSlug }: { exceptProductId?: number; exceptSlug?: string }) {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  const selling = (products ?? []).filter((p) => p.id !== exceptProductId && SELLING[p.id])
  const upcoming = UPCOMING.filter((p) => p.slug !== exceptSlug)

  return (
    <section className="dd-more" aria-label="다른 제품">
      <div className="inner">
        <h2>
          MORE FROM <em>DOLDOL</em>
        </h2>
        <div className="dd-cards">
          {selling.map((p) => {
            const info = SELLING[p.id]
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="dd-card" style={cardColors(info)}>
                <div className="pic">
                  <CardPouch />
                </div>
                <div className="meta">
                  <b>{p.name}</b>
                  <span>
                    {p.soldOut ? '품절' : `${formatPrice(p.minPrice)}~`} · {info.spec}
                  </span>
                </div>
              </Link>
            )
          })}
          {upcoming.map((p) => (
            <Link key={p.slug} to={`/lineup/${p.slug}`} className="dd-card" style={cardColors(p)}>
              <div className="pic" data-art={p.art}>
                <ProductArt kind={p.art} />
              </div>
              <div className="meta">
                <b>{p.name}</b>
                <span>출시 예정 · {p.spec}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 카드 속 작은 파우치 — 살짝 비스듬히 멈춰 있다 */
function CardPouch() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    posePouch(ref.current, { rz: -6, ry: -18 })
  }, [])
  return <SvgPouch ref={ref} />
}
