import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/products'
import { queryKeys } from '../../api/queryKeys'
import type { Product } from '../../api/types'
import { artKind, pageColors, statusLine, themeColors, type ProductColors } from '../../data/lineup'
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
export function SpinPouch({ label, front, back }: { label: string; front?: string | null; back?: string | null }) {
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
        <SvgPouch ref={pouchRef} label={label} front={front} back={back} />
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

/** MORE FROM DOLDOL — 지금 보는 것 말고 다른 제품 카드 (제품마다 제 색, 관리자 라인업 순서) */
export function MoreFromDoldol({ exceptProductId }: { exceptProductId?: number }) {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  const others = (products ?? []).filter((p) => p.id !== exceptProductId)
  if (others.length === 0) return null

  return (
    <section className="dd-more" aria-label="다른 제품">
      <div className="inner">
        <h2>
          MORE FROM <em>DOLDOL</em>
        </h2>
        <div className="dd-cards">
          {others.map((p) => (
            <Link key={p.id} to={`/products/${p.id}`} className="dd-card" style={cardColors(themeColors(p.theme))}>
              <div className="pic" data-art={artKind(p.art)}>
                <ProductFigure product={p} />
              </div>
              <div className="meta">
                <b>{p.name}</b>
                <span>{statusLine(p)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/** 멈춰 있는 제품 그림 — 파우치는 살짝 비스듬히 (도안이 있으면 도안), 병 · 유리병은 SVG */
export function ProductFigure({ product }: { product: Product }) {
  const kind = artKind(product.art)
  if (kind !== 'pouch') return <ProductArt kind={kind} />
  return <StillPouch front={product.artFrontUrl} back={product.artBackUrl} />
}

function StillPouch({ front, back }: { front: string | null; back: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    posePouch(ref.current, { rz: -6, ry: -18 })
  }, [])
  return <SvgPouch ref={ref} front={front} back={back} />
}
