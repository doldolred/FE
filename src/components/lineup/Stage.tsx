import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../../api/products'
import { queryKeys } from '../../api/queryKeys'
import { SELLING, UPCOMING, type PouchPhotos } from '../../data/lineup'
import { formatPrice } from '../../lib/format'
import { useReducedMotion } from '../../lib/useScroll'
import { ProductArt } from './Art'
import { posePouch } from '../../lib/pouch'
import PhotoPouch from './PhotoPouch'

/** 상세 무대 (v4-product) — 회색 판 · 굵은 테두리 · 뒤에 영문 이름 */
export function Stage({ badge, badgeRed, word, children }: { badge: string; badgeRed?: boolean; word: string; children: ReactNode }) {
  return (
    <div className="dd-stage">
      <span className="badge" data-red={badgeRed ? '' : undefined}>
        {badge}
      </span>
      <div className="word dd-display" aria-hidden="true">
        {word}
      </div>
      {children}
    </div>
  )
}

/** 무대 위 파우치 — 끌어서 돌리고, 놓으면 관성 → 천천히 혼자 좌우로 */
export function SpinPouch({ photos, alt }: { photos: PouchPhotos; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let ry = -20
    let vel = 0
    let dragging = false
    let lastX = 0
    let raf = 0
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      el.setPointerCapture(e.pointerId)
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
        ry += vel + (reduced ? 0 : 0.35)
      }
      posePouch(el, { y: reduced ? 0 : Math.sin(now / 900) * 8, rz: reduced ? 0 : Math.sin(now / 1400) * 3, ry })
      raf = requestAnimationFrame(tick)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [reduced])

  return (
    <>
      <span className="spin-hint">← 끌어서 돌려 보세요 →</span>
      <PhotoPouch ref={ref} photos={photos} alt={alt} className="grab relative z-[1] touch-pan-y" />
    </>
  )
}

const TILT = ['-3deg', '2deg', '-1deg']

/** 비스듬한 스티커 줄 */
export function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 flex flex-wrap gap-2.5">
      {items.map((t, i) => (
        <li key={t} className="dd-sticker !text-[13px]" style={{ '--r': TILT[i % 3] } as CSSProperties}>
          {t}
        </li>
      ))}
    </ul>
  )
}

/** MORE FROM DOLDOL — 지금 보는 것 말고 다른 제품 카드 */
export function MoreFromDoldol({ exceptProductId, exceptSlug }: { exceptProductId?: number; exceptSlug?: string }) {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  const selling = (products ?? []).filter((p) => p.id !== exceptProductId && SELLING[p.id])
  const upcoming = UPCOMING.filter((p) => p.slug !== exceptSlug)

  return (
    <section aria-label="다른 제품" className="mt-16 rounded-[28px] bg-neutral-950 px-5 py-12 text-white md:mt-24 md:px-10 md:py-16">
      <h2 className="dd-display mb-7 text-4xl md:text-6xl">
        More from <em className="text-[#e4002b] not-italic">DOLDOL</em>
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[18px]">
        {selling.map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="dd-more-card">
            <div className="pic">
              <img src={SELLING[p.id].photos.front} alt="" />
            </div>
            <div className="grid gap-1 px-[18px] pt-4 pb-5">
              <b className="text-[17px] font-black">{p.name}</b>
              <span className="text-[13px] font-bold text-neutral-500">
                {p.soldOut ? '품절' : `${formatPrice(p.minPrice)}~`} · {SELLING[p.id].spec}
              </span>
            </div>
          </Link>
        ))}
        {upcoming.map((p) => (
          <Link key={p.slug} to={`/lineup/${p.slug}`} className="dd-more-card">
            <div className="pic" data-art={p.art}>
              <ProductArt kind={p.art} />
            </div>
            <div className="grid gap-1 px-[18px] pt-4 pb-5">
              <b className="text-[17px] font-black">{p.name}</b>
              <span className="text-[13px] font-bold text-neutral-500">출시 예정 · {p.spec}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
