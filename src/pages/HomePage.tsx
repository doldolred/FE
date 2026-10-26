import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import type { Product } from '../api/types'
import { Beetroot, BeetSlice, ProductArt, TornEdge } from '../components/lineup/Art'
import PhotoPouch from '../components/lineup/PhotoPouch'
import { posePouch } from '../lib/pouch'
import { MAIN_PRODUCT_ID, SELLING, UPCOMING, type UpcomingProduct } from '../data/lineup'
import { formatPrice } from '../lib/format'

/**
 * 메인 — 프로토타입 v4 (protohtml/v4.html) 그대로의 흐름.
 *
 *   0 LINEUP      화면이 붙잡힌 채, 비트즙 파우치는 위에서 내려오고 출시 예정 제품은 아래에서 올라와 가운데서 만난다.
 *                 멈춰 있는 동안 제품을 누르면 상세(판매중) · 미리 보기(출시 예정)로. 더 내리면 다른 제품은 위로 빠진다
 *   1 UNBEETABLE  통비트가 떨어진다
 *   2 비트만      스티커
 *   3 DAILY RED   파우치가 받침대 위에 내려앉는다
 *   구매 띠       옵션 · 가격 · 구매하기
 *
 * 파우치는 네 장면 위를 내내 따라가는 한 장 (실제 사진, components/lineup/PhotoPouch).
 * 효능 · 건강 주장 문구는 넣지 않는다 (식품).
 */

const PIN_END = 1.6 / 2.6 // 0번 장면 높이 260svh 중 붙잡는 부분

interface Key {
  s: number
  x: number
  y: number
  rz: number
  ry: number
  sc: number
}

/** s = 흐름 맨 위에서 내려온 정도 (0 ~ 1 = 0번 장면, 1 = 1번 …). x · y 는 화면 비율, ry 는 몸을 도는 각도 */
function buildKeys(d: number): Key[] {
  return [
    // 0 LINEUP — 위에서 돌며 내려와 가운데 멈춤 → 다른 제품이 빠지면 1번으로
    { s: 0.0, x: 0, y: -0.6, rz: -22, ry: -70, sc: d },
    { s: 0.2, x: 0, y: 0, rz: -3, ry: -14, sc: d },
    { s: 0.42, x: 0, y: 0, rz: 2, ry: 8, sc: d },
    { s: PIN_END, x: 0, y: 0.05, rz: 6, ry: 60, sc: 0.95 },
    // 1 ~ 3
    { s: 1.0, x: -0.02, y: 0.02, rz: 16, ry: 338, sc: 1.0 },
    { s: 1.45, x: -0.1, y: 0.18, rz: -12, ry: 510, sc: 1.05 },
    { s: 2.0, x: 0.16, y: 0.06, rz: -24, ry: 696, sc: 1.18 },
    { s: 2.5, x: 0.04, y: 0.2, rz: 8, ry: 840, sc: 1.05 },
    { s: 3.05, x: 0.0, y: 0.13, rz: 0, ry: 1080, sc: 0.86 },
  ]
}

// 아래에서 올라오는 제품 — 가운데서 멈췄다가 위로 빠진다
const RISE = [
  { s: 0.0, y: 0.6, r: 16, o: 1 },
  { s: 0.2, y: 0, r: 0, o: 1 },
  { s: 0.42, y: 0, r: 0, o: 1 },
  { s: PIN_END, y: -0.78, r: -12, o: 0 },
]

const smooth = (t: number) => t * t * (3 - 2 * t)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function interp<T extends { s: number }>(keys: T[], s: number): T {
  if (s <= keys[0].s) return keys[0]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (s <= b.s) {
      const t = smooth((s - a.s) / (b.s - a.s))
      const mix = { ...a }
      for (const k of Object.keys(a) as (keyof T)[]) {
        ;(mix[k] as number) = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t
      }
      return mix
    }
  }
  return keys[keys.length - 1]
}

const tilt = (r: string) => ({ '--r': r }) as CSSProperties

/** 라인업 칸 자리 — 메인은 가운데(0), 나머지는 왼쪽 · 오른쪽 번갈아 바깥으로 */
const slotOf = (i: number) => (i % 2 === 0 ? -1 : 1) * (Math.floor(i / 2) + 1)

export default function HomePage() {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  // 라인업 맨 앞 = 사진이 준비된 판매중 상품 (지금은 레드비트즙 하나)
  const main: Product | undefined = products?.find((p) => SELLING[p.id]) ?? products?.[0]
  const info = SELLING[main?.id ?? MAIN_PRODUCT_ID] ?? SELLING[MAIN_PRODUCT_ID]
  const location = useLocation()

  const flowRef = useRef<HTMLDivElement>(null)
  const pouchRef = useRef<HTMLDivElement>(null)
  const plinthRef = useRef<HTMLDivElement>(null)
  const lineupRef = useRef<HTMLDivElement>(null)
  const mainItemRef = useRef<HTMLAnchorElement>(null)
  const mainArtRef = useRef<HTMLDivElement>(null)
  const upcomingRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const cueRef = useRef<HTMLParagraphElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const s1Ref = useRef<HTMLElement>(null)

  // 다른 화면에서 /#s1 같은 주소로 왔을 때 그 장면으로
  useEffect(() => {
    if (!location.hash) return
    document.getElementById(location.hash.slice(1))?.scrollIntoView()
  }, [location.hash])

  // 1번 장면 — 화면에 들어오면 글자 · 통비트 연출 시작
  useEffect(() => {
    const el = s1Ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('in')
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 흐름 — 스크롤 위치로 파우치 · 라인업 칸을 매 프레임 옮긴다 (React 렌더 없이 직접)
  useEffect(() => {
    const flow = flowRef.current
    const pouch = pouchRef.current
    if (!flow || !pouch) return
    const secs = [...flow.querySelectorAll<HTMLElement>('.dd-sec')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let d = 0.85
    let keys = buildKeys(d)

    /** 라인업 칸 크기 — 그림 칸 높이를 라인업 때 파우치 높이에 맞춘다 */
    const size = () => {
      d = window.innerWidth < 700 ? 0.7 : 0.85
      keys = buildKeys(d)
      lineupRef.current?.style.setProperty('--ah', `${(pouch.offsetHeight * d).toFixed(0)}px`)
      if (mainArtRef.current) mainArtRef.current.style.width = `${(pouch.offsetWidth * d).toFixed(0)}px`
    }
    size()
    window.addEventListener('resize', size)

    /** 지금 몇 번째 장면의 어디쯤인가 — 장면 실제 높이 기준이라 모바일 주소창에도 안 어긋난다 */
    const flowPos = () => {
      let s = 0
      secs.forEach((el, i) => {
        const r = el.getBoundingClientRect()
        if (r.top <= 0) s = i + Math.min(1, -r.top / r.height)
      })
      return s
    }

    const setItem = (a: HTMLElement | null, x: number, y: number, r: number, o: number, dwell: number) => {
      if (!a) return
      a.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`
      a.style.opacity = o.toFixed(3)
      a.style.pointerEvents = dwell > 0.5 ? 'auto' : 'none'
      a.tabIndex = dwell > 0.5 ? 0 : -1
      const tag = a.querySelector<HTMLElement>('.dd-tag')
      if (tag) tag.style.opacity = dwell.toFixed(3)
    }

    // 헤더 글자색 — 흰 · 회색 장면엔 검게(로고 끝은 빨강), 검정 · 빨강 장면엔 희게
    const root = document.documentElement.style
    let tone = ''
    const setTone = (s: number) => {
      const next = s < 1 || (s >= 2 && s < 3) ? 'dark' : 'light'
      if (next === tone) return
      tone = next
      root.setProperty('--dd-head', next === 'dark' ? '#111111' : '#ffffff')
      root.setProperty('--dd-head-em', next === 'dark' ? '#e4002b' : '#ffffff')
    }

    let hover = 0
    let raf = 0
    const frame = (now: number) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const s = flowPos()
      setTone(s)
      const k = interp(keys, s)
      const bob = reduced ? 0 : Math.sin(now / 1000) * 6

      // 라인업에서 멈춰 있는 동안만 누를 수 있다
      const dwell = clamp01((s - 0.15) / 0.05) * (1 - clamp01((s - 0.44) / 0.05))
      const mainHot = dwell > 0.5 && mainItemRef.current?.matches(':hover, :focus-visible') ? 1 : 0
      hover += (mainHot - hover) * 0.15

      // 파우치 — 마지막 구간은 받침대 윗면에 정확히 내려앉는다 (받침대 위치를 매번 재서 맞춘다)
      const sc = k.sc * (1 + hover * 0.05)
      const land = smooth(clamp01((s - 2.5) / 0.55))
      const halfH = (pouch.offsetHeight * sc) / 2
      const plinthTop = plinthRef.current?.getBoundingClientRect().top ?? vh
      const landY = plinthTop - vh / 2 - halfH + 6
      const x = k.x * vw
      const y = k.y * vh * (1 - land) + landY * land + bob * (1 - land) - hover * 8
      posePouch(pouch, { x, y, rz: k.rz, ry: k.ry, sc })

      // 라인업 칸 — 0번 장면을 지나면 계산 안 함
      if (s < 1) {
        const gap = Math.min(vw < 700 ? 0.33 * vw : 0.27 * vw, 420)
        setItem(mainItemRef.current, x, k.y * vh + bob, 0, 1, dwell)
        upcomingRefs.current.forEach((a, i) => {
          const slot = slotOf(i)
          const delay = Math.abs(slot) * 0.02 + (slot > 0 ? 0.02 : 0)
          const q = interp(RISE, s - delay)
          const wobble = reduced ? 0 : Math.sin(now / 1000 + slot * 1.7) * 6
          setItem(a, slot * gap, q.y * vh + wobble, q.r * Math.sign(slot), q.o, dwell)
        })
        if (cueRef.current) cueRef.current.style.opacity = (1 - clamp01(s / 0.08)).toFixed(3)
        if (hintRef.current) hintRef.current.style.opacity = dwell.toFixed(3)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      root.removeProperty('--dd-head')
      root.removeProperty('--dd-head-em')
    }
  }, [])

  const mainHref = main ? `/products/${main.id}` : '#buy'
  const itemCount = 1 + UPCOMING.length
  const buyable = main?.options.filter((o) => !o.soldOut) ?? []

  return (
    <div className="text-[var(--dd-ink)]">
      <div className="dd-flow" ref={flowRef}>
        {/* 0 LINEUP — 위에서 비트즙, 아래에서 앞으로 나올 제품. 가운데서 만난다 */}
        <section className="dd-sec dd-s0" id="lineup" aria-label="돌돌 제품 라인업">
          <div className="pin">
            <div className="bgword dd-display" aria-hidden="true">
              LINEUP
            </div>
            <p className="kicker">DOLDOL · BEET LINEUP</p>
            <p className="count">{itemCount} ITEMS</p>
            <div className="dd-lineup" ref={lineupRef}>
              {/* 메인 — 그림은 흐르는 파우치가 맡고, 칸은 누르는 자리 + 이름표만 */}
              <Link to={mainHref} ref={mainItemRef} className="dd-lp" data-main="" aria-label={`${main?.name ?? '돌돌 레드비트즙'} 자세히 보기`}>
                <div className="art" ref={mainArtRef} />
                <span className="dd-tag">
                  <b>
                    <span className="opt">돌돌 </span>레드비트즙
                  </b>
                  <i>
                    판매중<span className="opt"> · 보러 가기</span> →
                  </i>
                </span>
              </Link>
              {UPCOMING.map((p, i) => (
                <UpcomingItem
                  key={p.slug}
                  product={p}
                  ref={(el) => {
                    upcomingRefs.current[i] = el
                  }}
                />
              ))}
            </div>
            <p className="cue" ref={cueRef} aria-hidden="true">
              SCROLL<i>↓</i>
            </p>
            <p className="hint" ref={hintRef}>
              제품을 눌러 자세히 보세요
            </p>
          </div>
          <TornEdge seed={3} color="#111111" />
        </section>

        {/* 1 UNBEETABLE */}
        <section className="dd-sec dd-s1" id="about" ref={s1Ref} aria-label="돌돌 레드비트즙">
          <div className="big dd-display">Unbeetable</div>
          <div className="dd-beetroot" aria-hidden="true">
            <Beetroot />
          </div>
          <p className="lead">
            제주 비트 하나로 꽉 채운
            <br />
            <b>한 포의 맛,</b> 직접 느껴 보세요.
          </p>
          <button className="try" type="button" onClick={() => document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth' })}>
            맛보기 →
          </button>
          <TornEdge seed={7} color="#f1f1f1" />
        </section>

        {/* 2 비트만 */}
        <section className="dd-sec dd-s2" aria-label="비트만">
          <h2 className="big dd-display">
            <span>물도 설탕도</span>
            <span>
              없이, <em>비트만</em>
            </span>
            <span>꽉 채웠어요</span>
          </h2>
          <div className="stickers" aria-hidden="true">
            <span className="dd-sticker" style={tilt('-6deg')} data-red="">
              비트 100%
            </span>
            <span className="dd-sticker" style={tilt('5deg')}>
              제주산 비트
            </span>
            <span className="dd-sticker" style={tilt('-3deg')}>
              120ml 한 포
            </span>
          </div>
          <p className="note">제주 비트를 통째로 씻어 그대로 착즙했어요(NFC). 뜯어서 바로, 하루 한 포.</p>
          <TornEdge seed={23} color="#e4002b" />
        </section>

        {/* 3 + DAILY RED */}
        <section className="dd-sec dd-s3" aria-label="매일 한 포">
          <div className="big dd-display">+ Daily Red</div>
          <p className="caption">
            매일 한 포,
            <br />
            붉은 습관.
            <br />
            120ml × 30포 · 60포
          </p>
          <div className="dd-plinth" ref={plinthRef} aria-hidden="true">
            <div className="top" />
            <div className="face" />
          </div>
          <div className="dd-props" aria-hidden="true">
            <div className="beet-a">
              <Beetroot />
            </div>
            <div className="beet-b">
              <Beetroot />
            </div>
            <div className="slice">
              <BeetSlice />
            </div>
            <div className="box">
              <b>
                RED
                <br />
                BEET
              </b>
              <span>120ml × 30포</span>
            </div>
          </div>
        </section>

        {/* 네 장면 위를 내내 따라가는 비트즙 파우치 */}
        <div className="dd-track" aria-hidden="true">
          <div className="dd-traveler">
            <PhotoPouch ref={pouchRef} photos={info.photos} alt="" />
          </div>
        </div>
      </div>

      {/* 구매 띠 */}
      <section className="dd-buybar" id="buy" aria-label="구매">
        <div className="inner">
          <div>
            <h2>
              돌돌 <em>레드비트즙</em>
              <br />
              제주산 100% NFC
            </h2>
            <p>120ml 파우치 · {buyable.length > 0 ? buyable.map((o) => o.name).join(' / ') : '30포 / 60포'} · 5만원 이상 무료배송</p>
          </div>
          <div className="cta">
            {main && <span className="price">{main.soldOut ? '품절' : `${formatPrice(main.minPrice)}~`}</span>}
            <Link className="dd-btn" data-primary="" to={mainHref}>
              구매하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function UpcomingItem({ product, ref }: { product: UpcomingProduct; ref: (el: HTMLAnchorElement | null) => void }) {
  return (
    <Link to={`/lineup/${product.slug}`} ref={ref} className="dd-lp" data-art={product.art} aria-label={`${product.name} 미리 보기`}>
      <div className="art">
        <ProductArt kind={product.art} />
      </div>
      <span className="dd-tag">
        <b>
          <span className="opt">돌돌 </span>
          {product.name.replace(/^돌돌 /, '')}
        </b>
        <i>
          출시 예정<span className="opt"> · 미리 보기</span> →
        </i>
      </span>
    </Link>
  )
}
