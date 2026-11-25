import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import type { Product } from '../api/types'
import { ProductFigure } from '../components/lineup/Stage'
import InstagramFeed from '../components/home/InstagramFeed'
import { KakaoBanner } from '../components/promo/KakaoChannel'
import HomeReviews from '../components/review/HomeReviews'
import { INGREDIENTS } from '../data/ingredients'
import SvgPouch from '../components/lineup/SvgPouch'
import { artKind, mainProductOf, shortName } from '../data/lineup'
import { formatPrice } from '../lib/format'
import type { BoxStage } from '../lib/box3d'
import { BOX_HANDOFF, BOX_HOLD, POUCH_GL_FRAME, posePouch } from '../lib/pouch'

/**
 * 메인 — 프로토타입 v4 의 흐름을 1차 수정 요청(미니멀 · 흑백 제주 바다 · 현무암)에 맞춰 다시 짰다.
 *
 *   0 표지(LINEUP)  화면이 붙잡힌 채, 비트즙 파우치는 위에서 내려오고 다른 제품은 아래에서 올라와 가운데서 만난다.
 *                   뒤에는 큰 DOLDOL 글씨 (제품이 글자 아래쪽을 덮는다). 흰 벽 아래는 흑백 제주 바다. 더 내리면 다른 제품은 위로 빠지고 바다가 화면을 채운 뒤, 현무암이 아래에서 덮으며 올라온다.
 *                   어떤 제품을 어떤 순서로 둘지는 관리자 상품 화면(상태 · 라인업 순서). 가운데 = 맨 앞 판매중 상품
 *   1 원물          현무암 위 — 제주 겨울 비트 100%, 통비트가 떨어진다
 *   2 공법          흰 바탕 — 정제수 0%, 제품 정보 카드
 *   3 성분          흰 바탕 — 화면이 붙잡힌 채 비트 성분이 양옆에서 하나씩 들어왔다 나간다 (data/ingredients)
 *   4 기관 평가     현무암 위 — IOC · AIS, 식이 질산염 수치 두 가지 + 안내 문구 (고객사 요청 문구 그대로)
 *   5 마무리        현무암 위 — 화면이 붙잡힌 채 열린 상자로 파우치가 들어가고, 뚜껑이 닫힌 뒤 상자가 일어서 윗면(RED BEET)을 보인다 (lib/box3d)
 *   구매 띠         옵션 · 가격 · 구매하기
 *   카카오 띠       채널 추가 쿠폰 안내 (components/promo/KakaoChannel)
 *   후기            자사몰 후기 (components/review/HomeReviews) — 평점 요약 + 베스트 · 최신 후기 카드
 *
 * 파우치는 네 장면 위를 내내 따라가는 한 장 (components/lineup/SvgPouch — WebGL 입체 모델). 세로로 천천히 넘어가며 돈다 (rx).
 * 헤더 글자색도 여기서 정한다: 헤더 뒤 장면의 data-tone(light · dark)에 맞춰 먹색/흰색, 로고는 파우치가 뒤로 지나갈 때 흰색.
 * 효능 · 건강 주장 문구는 넣지 않는다 (식품).
 */

/** 0번 장면에서 화면을 붙잡는 동안 = s 0 → 1 (200svh). 구간: 내려와 만남 → 멈춤 → 옆 제품이 빠지고 바다가 참 → 현무암이 덮음 */
const DWELL_IN = 0.22
const DWELL_OUT = 0.4
const SIDES_GONE = 0.6

interface Key {
  s: number
  x: number
  y: number
  rz: number
  ry: number
  /** 세로로 넘어가는 각도 — 360 의 배수에서 바로 선다 */
  rx: number
  sc: number
}

/**
 * s = 흐름 맨 위에서 내려온 정도 (0 ~ 1 = 0번 장면, 1 = 1번 …). x · y 는 화면 비율.
 * 파우치는 좌우로 움직이지 않고 수직으로만 떨어진다 (고객 요청) — x 는 늘 0, 기울기(rz)도 0.
 * 도는 것은 세로(rx)로, 처음부터 끝까지 세 바퀴 — 글을 읽는 자리(1번 · 2번 장면 가운데, 마무리)에서는 바로 선다.
 * narrow(휴대폰): 글자가 위 · 아래로 쌓이니 파우치는 가운데 빈 띠에 작게 — 제목 · 카드와 겹치지 않게.
 */
function buildKeys(d: number, narrow: boolean): Key[] {
  if (narrow) {
    return [
      { s: 0.0, x: 0, y: -0.6, rz: 0, ry: -16, rx: -55, sc: d },
      { s: DWELL_IN, x: 0, y: 0, rz: 0, ry: -12, rx: 0, sc: d },
      { s: DWELL_OUT, x: 0, y: 0, rz: 0, ry: 8, rx: 0, sc: d },
      { s: 0.7, x: 0, y: 0.04, rz: 0, ry: 6, rx: 110, sc: 0.8 },
      { s: 1.25, x: 0, y: 0.1, rz: 0, ry: -10, rx: 360, sc: 0.82 },
      { s: 1.75, x: 0, y: 0.12, rz: 0, ry: 0, rx: 520, sc: 0.8 },
      { s: 2.3, x: 0, y: -0.03, rz: 0, ry: -10, rx: 720, sc: 0.72 }, // 제목과 제품 정보 카드 사이
      // 3 성분 — 제목과 성분 글 사이에 서서 천천히 몸을 돌린다
      { s: 3.0, x: 0, y: -0.07, rz: 0, ry: -16, rx: 720, sc: 0.62 },
      { s: 3.75, x: 0, y: -0.07, rz: 0, ry: 16, rx: 720, sc: 0.62 },
      // 4 기관 평가 — 글이 화면을 다 쓰니 아래로 떨어져 빠졌다가, 마무리에서 위에서 다시 떨어진다
      // (화면 밖에서 위로 자리를 옮기는 4.44 ~ 4.46 은 감춰 둔다 — HIDE_FROM · HIDE_TO)
      { s: 4.15, x: 0, y: 0.9, rz: 0, ry: 0, rx: 900, sc: 0.6 },
      { s: 4.44, x: 0, y: 0.9, rz: 0, ry: 0, rx: 1080, sc: 0.6 },
      { s: 4.46, x: 0, y: -0.9, rz: 0, ry: 0, rx: 1080, sc: 0.62 },
      { s: 4.75, x: 0, y: -0.9, rz: 0, ry: 0, rx: 1080, sc: 0.62 },
      { s: 5.0, x: 0, y: -0.13, rz: 0, ry: 0, rx: 1080, sc: 0.62 }, // 열린 상자 위 — 여기서 상자 장면이 넘겨받는다
    ]
  }
  // 넓은 화면 — 파우치는 늘 화면 가운데 세로선 위 (x = 0, 기울기 없음). 글은 왼쪽 단, 곁들이는 것은 오른쪽 단
  return [
    // 0 표지 — 위에서 넘어오며 내려와 가운데 멈춤 → 다른 제품이 빠지면 1번으로
    { s: 0.0, x: 0, y: -0.6, rz: 0, ry: -16, rx: -55, sc: d },
    { s: DWELL_IN, x: 0, y: 0, rz: 0, ry: -12, rx: 0, sc: d },
    { s: DWELL_OUT, x: 0, y: 0, rz: 0, ry: 8, rx: 0, sc: d },
    { s: 0.7, x: 0, y: 0.04, rz: 0, ry: 6, rx: 110, sc: 0.95 },
    // 1 원물 · 2 공법
    { s: 1.25, x: 0, y: 0.04, rz: 0, ry: -10, rx: 360, sc: 1.0 },
    { s: 1.75, x: 0, y: 0.08, rz: 0, ry: 0, rx: 520, sc: 1.0 },
    { s: 2.3, x: 0, y: 0.03, rz: 0, ry: -10, rx: 720, sc: 1.0 },
    // 3 성분 — 천천히 몸을 돌린다 (성분은 양옆에서 들어온다)
    { s: 3.0, x: 0, y: 0.03, rz: 0, ry: -16, rx: 720, sc: 0.95 },
    { s: 3.75, x: 0, y: 0.03, rz: 0, ry: 16, rx: 720, sc: 0.95 },
    // 4 기관 평가
    { s: 4.25, x: 0, y: 0.04, rz: 0, ry: -10, rx: 1080, sc: 0.9 },
    { s: 4.7, x: 0, y: 0.06, rz: 0, ry: 6, rx: 1080, sc: 0.9 },
    { s: 5.0, x: 0, y: -0.15, rz: 0, ry: 0, rx: 1080, sc: 0.72 }, // 열린 상자 위 — 여기서 상자 장면이 넘겨받는다
  ]
}

/** 휴대폰에서 파우치를 감춰 두는 구간 (기관 평가 — 화면 아래로 빠진 뒤 위로 자리를 옮기는 동안) */
const HIDE_FROM = 4.2
const HIDE_TO = 4.72

// 아래에서 올라오는 제품 — 가운데서 멈췄다가 위로 빠진다
const RISE = [
  { s: 0.0, y: 0.6, r: 0, o: 1 },
  { s: DWELL_IN, y: 0, r: 0, o: 1 },
  { s: DWELL_OUT, y: 0, r: 0, o: 1 },
  { s: SIDES_GONE, y: -0.78, r: 0, o: 0 },
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


/** 라인업 칸 자리 — 메인은 가운데(0), 나머지는 왼쪽 · 오른쪽 번갈아 바깥으로 */
const slotOf = (i: number) => (i % 2 === 0 ? -1 : 1) * (Math.floor(i / 2) + 1)

export default function HomePage() {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  // 가운데 = 맨 앞 판매중 상품, 양옆 = 나머지 (판매중 · 출시 예정, 관리자 라인업 순서)
  const main: Product | undefined = mainProductOf(products)
  const sides = (products ?? []).filter((p) => p !== main)
  const location = useLocation()

  const flowRef = useRef<HTMLDivElement>(null)
  const pouchRef = useRef<HTMLDivElement>(null)
  const s3Ref = useRef<HTMLElement>(null)
  const boxHostRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const ingRef = useRef<HTMLElement>(null)
  const ingCountRef = useRef<HTMLElement>(null)
  const boxStageRef = useRef<BoxStage | null>(null)
  const lineupRef = useRef<HTMLDivElement>(null)
  const mainItemRef = useRef<HTMLAnchorElement>(null)
  const mainArtRef = useRef<HTMLDivElement>(null)
  const upcomingRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const cueRef = useRef<HTMLParagraphElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const s1Ref = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const buybarRef = useRef<HTMLElement>(null)
  const floatRef = useRef<HTMLAnchorElement>(null)

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

  // 마무리의 상자 장면 — three.js 를 그때 불러온다. 도안이 없거나 WebGL 이 안 되면 장면을 짧게 접는다 (data-nobox)
  const artFront = main?.artFrontUrl
  const artBack = main?.artBackUrl
  const loaded = !!products
  useEffect(() => {
    const host = boxHostRef.current
    const sec = s3Ref.current
    if (!host || !sec || !loaded) return
    if (!artFront) {
      sec.setAttribute('data-nobox', '')
      return () => sec.removeAttribute('data-nobox')
    }
    let dead = false
    let stage: BoxStage | null = null
    // 실행마다 새 캔버스 — 정리할 때 WebGL 을 놓아 버리므로 다시 쓸 수 없다
    const canvas = document.createElement('canvas')
    host.append(canvas)
    import('../lib/box3d')
      .then((m) => m.createBoxStage(canvas, { front: artFront, back: artBack }))
      .then((s) => {
        if (dead) return s.dispose()
        stage = s
        boxStageRef.current = s
      })
      .catch(() => {
        if (!dead) sec.setAttribute('data-nobox', '')
      })
    return () => {
      dead = true
      boxStageRef.current = null
      stage?.dispose()
      canvas.remove()
      sec.removeAttribute('data-nobox')
    }
  }, [artFront, artBack, loaded])

  // 흐름 — 스크롤 위치로 파우치 · 라인업 칸을 매 프레임 옮긴다 (React 렌더 없이 직접)
  useEffect(() => {
    const flow = flowRef.current
    const pouch = pouchRef.current
    if (!flow || !pouch) return
    const secs = [...flow.querySelectorAll<HTMLElement>('.dd-sec')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let d = 0.85
    let narrow = window.innerWidth < 700
    let keys = buildKeys(d, narrow)
    /**
     * 화면 높이 — 붙잡힌 칸(100svh)의 높이를 쓴다. window.innerHeight 는 휴대폰에서 위로 스크롤해 주소창이 다시 나올 때마다 바뀌어
     * 파우치 자리 · 상자 장면이 매 프레임 다시 계산되고 버벅였다.
     */
    let viewH = window.innerHeight
    let lastW = window.innerWidth
    /** 마무리 장면에서 글이 위쪽에 차지한 높이(px) — 글이 왼쪽에 서는 넓은 화면은 0 */
    let copyTop = 0

    /** 라인업 칸 크기 — 그림 칸 높이를 라인업 때 파우치 높이에 맞춘다 */
    const size = () => {
      narrow = window.innerWidth < 700
      viewH = (pouch.parentElement as HTMLElement).offsetHeight || window.innerHeight
      d = narrow ? 0.7 : 0.85
      keys = buildKeys(d, narrow)
      // 고정 화면(.pin)에 둔다 — 라인업 칸과 배경 선반 높이가 같이 쓴다
      lineupRef.current?.parentElement?.style.setProperty('--ah', `${(pouch.offsetHeight * d).toFixed(0)}px`)
      if (mainArtRef.current) mainArtRef.current.style.width = `${(pouch.offsetWidth * d).toFixed(0)}px`
      // 세로로 길거나 좁은 화면은 글이 위로 올라간다 (lineup.css 의 --copy-top) — 상자가 그 아래로 오게 높이를 넘긴다
      const copy = copyRef.current
      const onTop = copy && window.innerWidth / window.innerHeight < 1.25 && getComputedStyle(copy).getPropertyValue('--copy-top').trim() === '1'
      copyTop = onTop ? Math.round(copy.offsetTop + copy.offsetHeight + 18) : 0
    }
    size()
    // 터치 기기에서 높이만 바뀐 것(주소창이 나오고 들어감)은 무시한다 — 폭이 바뀌었을 때만 다시 잰다
    const onResize = () => {
      if (window.innerWidth === lastW && window.matchMedia('(pointer: coarse)').matches) return
      lastW = window.innerWidth
      size()
    }
    window.addEventListener('resize', onResize)
    // 글꼴이 늦게 오면 글 높이가 달라진다
    void document.fonts.ready.then(size)

    /**
     * 지금 몇 번째 장면의 어디쯤인가 — 장면 실제 위치 기준이라 모바일 주소창에도 안 어긋난다.
     * 한 장면의 길이 = 다음 장면 맨 위까지 (1번 장면이 0번 위로 겹쳐 올라오므로 장면 높이로 재면 안 된다)
     */
    const flowPos = () => {
      let s = 0
      secs.forEach((el, i) => {
        const top = el.getBoundingClientRect().top
        if (top > 0) return
        const next = secs[i + 1]
        const span = next ? next.getBoundingClientRect().top - top : el.offsetHeight
        s = i + Math.min(1, -top / span)
      })
      return s
    }

    // 헤더 글자색 — 헤더 뒤에 깔린 장면의 data-tone 을 따른다 (나중 요소가 위에 깔린다)
    const root = document.documentElement
    const logo = document.querySelector<HTMLElement>('header .dd-logo')
    const tones = [...document.querySelectorAll<HTMLElement>('[data-tone]')]
    // 현무암 면은 돌 가장자리만큼 제 장면보다 위로 올라와 있다 — 그만큼 일찍 어두운 바탕으로 본다
    const rocky = new Set(tones.filter((el) => el.querySelector('.dd-rock')))
    let fg = ''
    let logoOver = false
    let sea = -1
    let floating = false
    // 상자 장면에 마지막으로 넘긴 값 (같으면 다시 그리지 않는다)
    let boxSeen: BoxStage | null = null
    let boxP = -1
    let boxKey = ''
    let gone = -1
    // 성분 구간
    const ingItems = [...(ingRef.current?.querySelectorAll<HTMLElement>('.items li') ?? [])]
    let ingSeen = -1

    const setItem = (a: HTMLElement | null, x: number, y: number, r: number, o: number, dwell: number) => {
      if (!a) return
      a.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`
      a.style.opacity = o.toFixed(3)
      a.style.pointerEvents = dwell > 0.5 ? 'auto' : 'none'
      a.tabIndex = dwell > 0.5 ? 0 : -1
      const tag = a.querySelector<HTMLElement>('.dd-tag')
      if (tag) tag.style.opacity = dwell.toFixed(3)
    }

    let hover = 0
    let raf = 0
    const frame = (now: number) => {
      const vw = window.innerWidth
      const vh = viewH
      const s = flowPos()
      const k = interp(keys, s)
      const bob = reduced ? 0 : Math.sin(now / 1000) * 6

      // 라인업에서 멈춰 있는 동안만 누를 수 있다
      const dwell = clamp01((s - (DWELL_IN - 0.05)) / 0.05) * (1 - clamp01((s - (DWELL_OUT + 0.02)) / 0.05))
      const mainHot = dwell > 0.5 && mainItemRef.current?.matches(':hover, :focus-visible') ? 1 : 0
      hover += (mainHot - hover) * 0.15

      // 파우치 — 마무리로 갈수록 흔들림을 멈추고 상자 위에 바로 선다
      const calm = clamp01((s - (secs.length - 1.4)) / 0.4)
      // 상자 장면이 넘겨받을 때 파우치가 상자 속 파우치보다 작으면 안 된다 (뚜껑 뒤로 멀어지는 셈) — 세로로 긴 화면에서는 그만큼 키운다
      const stage = boxStageRef.current
      const minSc = stage ? (stage.pouchPx() * 1.05) / (pouch.offsetHeight * POUCH_GL_FRAME.scale) : 0
      const sc = (k.sc + Math.max(0, minSc - k.sc) * calm) * (1 + hover * 0.05)
      const x = k.x * vw
      const y = k.y * vh + bob * (1 - calm) - hover * 8
      posePouch(pouch, { x, y, rz: k.rz, ry: k.ry, rx: k.rx, sc })

      // 성분 — 붙잡힌 동안 하나씩 제 쪽 옆에서 들어왔다가 위로 사라진다 (마지막 것은 남는다)
      const ingBox = ingRef.current?.getBoundingClientRect()
      if (ingBox && ingBox.top < vh && ingBox.bottom > 0) {
        const n = ingItems.length
        // 들어오는 동안(-1 ~ 0) + 붙잡힌 동안(0 ~ n)
        const at = ingBox.top > 0 ? -ingBox.top / vh : clamp01(-ingBox.top / Math.max(1, ingBox.height - vh)) * n
        if (at !== ingSeen) {
          ingSeen = at
          ingItems.forEach((el, i) => {
            const local = at - i
            const tin = smooth(clamp01(i === 0 ? (local + 0.45) / 0.4 : local / 0.3))
            const tout = i === n - 1 ? 0 : smooth(clamp01((local - 0.75) / 0.25))
            const side = el.dataset.side === 'right' ? 1 : -1
            el.style.opacity = (tin * (1 - tout)).toFixed(3)
            el.style.transform = `translate3d(${(side * (1 - tin) * 90).toFixed(1)}px, ${(-tout * 36).toFixed(1)}px, 0)`
          })
          if (ingCountRef.current) ingCountRef.current.textContent = String(Math.min(n, Math.max(1, Math.floor(at) + 1))).padStart(2, '0')
        }
      }

      // 마무리 — 붙잡힌 동안의 진행(p)으로 상자 장면을 그린다. p 가 BOX_HANDOFF 에 이르면 상자 장면이 같은 자리 · 같은 크기의 파우치를 세우고,
      // 흐르던 파우치는 사라진다 (그 뒤는 상자 장면 안에서 상자로 들어간다)
      const sec3 = s3Ref.current
      const r3 = sec3?.getBoundingClientRect()
      const p = r3 ? clamp01(-r3.top / Math.max(1, r3.height - vh)) : 0
      const goneNow = narrow && s > HIDE_FROM && s < HIDE_TO ? 1 : stage ? clamp01((p - BOX_HANDOFF) / BOX_HOLD) : 0
      if (goneNow !== gone) {
        gone = goneNow
        pouch.style.opacity = (1 - gone).toFixed(3)
        pouch.style.visibility = gone >= 1 ? 'hidden' : ''
      }
      if (stage && r3 && r3.top < vh && r3.bottom > 0) {
        const host = boxHostRef.current!.getBoundingClientRect()
        // 흐름 끝을 지나면 sticky 가 풀려 파우치 칸이 같이 올라간다 — 화면 가운데가 아니라 칸의 실제 가운데에서 잰다
        const tr = pouch.parentElement!.getBoundingClientRect()
        const boxH = pouch.offsetHeight * sc
        const from = {
          x: tr.left + tr.width / 2 + x - host.left,
          // 파우치 바닥은 상자 바닥, 전체 높이는 상자의 scale 배 → 가운데는 그만큼 위
          y: tr.top + tr.height / 2 + y - (boxH * (POUCH_GL_FRAME.scale - 1)) / 2 - host.top,
          h: boxH * POUCH_GL_FRAME.scale,
        }
        const key = `${from.x.toFixed(1)},${from.y.toFixed(1)},${from.h.toFixed(1)},${host.width},${host.height},${copyTop}`
        if (stage !== boxSeen || p !== boxP || key !== boxKey) {
          boxSeen = stage
          boxP = p
          boxKey = key
          stage.set(p, from, copyTop)
          sec3!.style.setProperty('--bx', p.toFixed(3))
        }
      }

      // 바다 — 옆 제품이 빠지는 동안 위아래로 넓어져 화면을 채운다
      const seaNow = Math.round(smooth(clamp01((s - (DWELL_OUT - 0.04)) / (SIDES_GONE - DWELL_OUT + 0.04))) * 1000) / 1000
      if (seaNow !== sea) {
        sea = seaNow
        pinRef.current?.style.setProperty('--sea', String(sea))
      }

      // 헤더 글자색 · 로고 (파우치가 로고 뒤로 지나가면 흰색)
      const lr = logo?.getBoundingClientRect()
      if (lr) {
        const mid = lr.top + lr.height / 2
        let tone = 'light'
        for (const el of tones) {
          const r = el.getBoundingClientRect()
          const lead = rocky.has(el) ? Math.min(124, Math.max(44, vw * 0.075)) * 0.5 : 0
          if (r.top - lead <= mid && r.bottom > mid) tone = el.dataset.tone ?? tone
        }
        const fgNow = tone === 'dark' ? '#fff' : '#222021'
        if (fgNow !== fg) {
          fg = fgNow
          root.style.setProperty('--dd-hero-fg', fg)
        }
        const pr = (pouch.firstElementChild as HTMLElement).getBoundingClientRect()
        const inset = pr.width * 0.14 // 상자보다 파우치가 좁다
        const over = gone < 1 && pr.left + inset < lr.right && pr.right - inset > lr.left && pr.top < lr.bottom && pr.bottom > lr.top
        if (over !== logoOver) {
          logoOver = over
          if (over) root.style.setProperty('--dd-hero-logo', '#fff')
          else root.style.removeProperty('--dd-hero-logo')
        }
      }

      // 떠 있는 구매 버튼 — 표지에서 제품을 본 뒤부터, 구매 띠가 보이기 전까지
      const barTop = buybarRef.current?.getBoundingClientRect().top ?? Infinity
      const floatNow = s > DWELL_OUT && barTop > vh * 0.92
      if (floatNow !== floating) {
        floating = floatNow
        floatRef.current?.toggleAttribute('data-on', floating)
      }

      // 라인업 칸 — 0번 장면을 지나면 계산 안 함
      if (s < 1) {
        const gap = Math.min(vw < 700 ? 0.33 * vw : 0.27 * vw, 560)
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
      window.removeEventListener('resize', onResize)
      root.style.removeProperty('--dd-hero-fg')
      root.style.removeProperty('--dd-hero-logo')
    }
  }, [])

  const mainHref = main ? `/products/${main.id}` : '#buy'
  const buyable = main?.options.filter((o) => !o.soldOut) ?? []

  return (
    <div className="dd-home">
      <div className="dd-flow" ref={flowRef}>
        {/* 0 표지 — 위에서 비트즙, 아래에서 앞으로 나올 제품. 가운데서 만난다. 흰 벽 아래는 흑백 제주 바다 */}
        <section className="dd-sec dd-s0" id="lineup" data-tone="light" aria-label="돌돌 제품 라인업">
          <div className="pin" ref={pinRef}>
            <div className="sea" aria-hidden="true" />
            <div className="bgword" aria-hidden="true">
              DOLDOL
            </div>
            <p className="kicker dd-kicker">JEJU · RED BEET</p>
            <div className="dd-lineup" ref={lineupRef}>
              {/* 메인 — 그림은 흐르는 파우치가 맡고, 칸은 누르는 자리 + 이름표만 */}
              <Link to={mainHref} ref={mainItemRef} className="dd-lp" data-main="" aria-label={`${main?.name ?? '돌돌 레드비트즙'} 자세히 보기`}>
                <div className="art" ref={mainArtRef} />
                <span className="dd-tag">
                  <b>
                    <span className="opt">돌돌 </span>
                    {main ? shortName(main.name) : '레드비트즙'}
                  </b>
                  <i>
                    판매중<span className="opt"> · 보러 가기</span> →
                  </i>
                </span>
              </Link>
              {sides.map((p, i) => (
                <LineupItem
                  key={p.id}
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
            {/* 들어오자마자 바로 구매 화면으로 */}
            <Link to={mainHref} className="buy dd-juicy">
              구매하기 →
            </Link>
          </div>
        </section>

        {/* 1 원물 — 현무암이 바다 위로 덮으며 올라온다 */}
        <section className="dd-sec dd-s1" id="about" data-tone="dark" ref={s1Ref} aria-label="원물">
          <div className="dd-rock" aria-hidden="true" />
          <p className="kicker dd-kicker">UNBEETABLE · 원물</p>
          <h2 className="big">
            <span>제주</span>
            <span>겨울 비트</span>
            <span>
              <em>100%</em>
            </span>
          </h2>
          {/* 떨어지는 통비트 · 반 자른 비트 (배경 지운 사진) */}
          <img className="dd-beetroot" src="/art/beet-whole.webp" alt="" aria-hidden="true" width={640} height={651} />
          <img className="dd-beetroot" data-half="" src="/art/beet-half.webp" alt="" aria-hidden="true" width={640} height={610} />
          <p className="lead">제주에서 자란 비트만 통째로 씻어 담았어요. 다른 과일이나 채소는 섞지 않았어요.</p>
        </section>

        {/* 2 공법 — 흰 바탕 */}
        <section className="dd-sec dd-s2" data-tone="light" aria-label="공법">
          <p className="kicker dd-kicker">NFC · 공법</p>
          <h2 className="big">
            <span>
              <em>정제수 0%</em>
            </span>
            <span>물 한 방울</span>
            <span>없는 착즙</span>
          </h2>
          {/* 영양성분표처럼 생긴 제품 정보 카드 */}
          <aside className="dd-facts" aria-label="제품 정보">
            <p className="t">제품 정보</p>
            <p className="s">레드비트즙 · 1포 120ml</p>
            <dl>
              <div>
                <dt>원재료</dt>
                <dd>제주산 비트 100%</dd>
              </div>
              <div>
                <dt>물 · 설탕 첨가</dt>
                <dd>없음</dd>
              </div>
              <div>
                <dt>용량</dt>
                <dd>120ml × 1포</dd>
              </div>
            </dl>
            <p className="note">제주산 비트를 통째로 씻어 착즙했어요. 뜯어서 바로, 하루 한 포.</p>
          </aside>
        </section>

        {/* 3 성분 — 흰 바탕. 화면이 붙잡힌 채 성분이 양옆에서 하나씩 들어왔다 나간다 */}
        <section className="dd-sec dd-s4" data-tone="light" ref={ingRef} style={{ '--n': INGREDIENTS.length } as CSSProperties} aria-label="비트 성분">
          <div className="stage">
            <p className="kicker dd-kicker">INSIDE · 비트 성분</p>
            <h2 className="title">
              비트 한 뿌리에
              <br />
              들어 있는 것
            </h2>
            <p className="count" aria-hidden="true">
              <b ref={ingCountRef}>01</b> / {String(INGREDIENTS.length).padStart(2, '0')}
            </p>
            <ol className="items">
              {INGREDIENTS.map((g, i) => (
                <li key={g.en} data-side={i % 2 ? 'right' : 'left'}>
                  <img src={g.img} alt="" width={640} height={640} loading="lazy" />
                  <p className="no">{String(i + 1).padStart(2, '0')}</p>
                  <h3>
                    {g.ko}
                    <span>{g.en}</span>
                  </h3>
                  <p className="text">{g.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 4 기관 평가 — 현무암 위. 문구 · 수치는 고객사 요청서 그대로 */}
        <section className="dd-sec dd-s5" data-tone="dark" aria-label="기관 평가">
          <div className="dd-rock" data-flat-bottom="" aria-hidden="true" />
          <div className="inner">
            <div className="text">
              <p className="eyebrow dd-kicker">IOC · AIS</p>
              <h2>
                국제올림픽위원회(IOC) &amp; 호주스포츠연구소(AIS)가 주목한 <em>최상위 Group A 성분,</em> 식이 질산염
              </h2>
              <p className="note">※ 원물(레드비트) 및 식이 질산염에 대한 학술 연구 기준이며, 제품 효능과 무관합니다.</p>
            </div>
            <ul className="stats">
              <li>
                <span className="k">운동 시 근육 산소 소모량</span>
                <b>
                  <small>약</small>3~5%
                </b>
                <span className="v">감소</span>
              </li>
              <li>
                <span className="k">고강도 운동 시 탈진 도달 시간</span>
                <b>
                  <small>약</small>15%
                </b>
                <span className="v">연장</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 5 마무리 — 현무암 위. 화면이 붙잡힌 채 파우치가 상자에 들어가고, 뚜껑이 닫힌 뒤 상자가 일어서 윗면을 보인다 */}
        <section className="dd-sec dd-s3" data-tone="dark" ref={s3Ref} aria-label="매일 한 포">
          <div className="stage">
            <div className="dd-rock" data-flat-bottom="" aria-hidden="true" />
            <div className="boxgl" ref={boxHostRef} aria-hidden="true" />
            <div className="copy" ref={copyRef}>
              <div className="big">
                + Daily <br />
                Red
              </div>
              <p className="caption">
                매일 한 포,
                <br />
                붉은 습관.
                <br />
                120ml × 30포
              </p>
            </div>
          </div>
        </section>

        {/* 네 장면 위를 내내 따라가는 비트즙 파우치 */}
        <div className="dd-track" aria-hidden="true">
          <div className="dd-traveler">
            <SvgPouch ref={pouchRef} front={main?.artFrontUrl} back={main?.artBackUrl} webgl />
          </div>
        </div>
      </div>

      {/* 구매 띠 */}
      <section className="dd-buybar" id="buy" data-tone="dark" ref={buybarRef} aria-label="구매">
        <div className="inner">
          <div>
            <h2>
              돌돌 <em>레드비트즙</em>
              <br />
              {buyable.length > 0 ? `${buyable.map((o) => o.name).join(' · ')} 한 상자` : '30포 한 상자'}
            </h2>
            <p>제주산 비트 100% · 120ml 파우치 · 5만원 이상 무료배송</p>
          </div>
          <div className="cta">
            {main && <span className="price">{main.soldOut ? '품절' : `${formatPrice(main.minPrice)}~`}</span>}
            <Link className="btn" to={mainHref}>
              구매하기
            </Link>
          </div>
        </div>
      </section>

      {/* 카카오톡 채널 쿠폰 띠 */}
      <KakaoBanner />

      {/* 자사몰 후기 — 후기가 하나도 없거나 서버에 닿지 못하면 구간째 숨는다 */}
      <HomeReviews products={products} />

      {/* 인스타그램 */}
      <InstagramFeed />

      {/* 떠 있는 구매 버튼 — 스크롤 중 언제든 구매 화면으로 */}
      <Link to={mainHref} className="dd-floatbuy" ref={floatRef}>
        구매하기 →
      </Link>
    </div>
  )
}

/** 양옆 제품 한 칸 — 판매중이면 "보러 가기", 출시 예정이면 "미리 보기" */
function LineupItem({ product, ref }: { product: Product; ref: (el: HTMLAnchorElement | null) => void }) {
  const soon = product.status === 'COMING_SOON'
  return (
    <Link to={`/products/${product.id}`} ref={ref} className="dd-lp" data-art={artKind(product.art)} aria-label={`${product.name} ${soon ? '미리 보기' : '자세히 보기'}`}>
      <div className="art">
        <ProductFigure product={product} />
      </div>
      <span className="dd-tag">
        <b>
          <span className="opt">돌돌 </span>
          {shortName(product.name)}
        </b>
        <i>
          {soon ? '출시 예정' : '판매중'}
          <span className="opt"> · {soon ? '미리 보기' : '보러 가기'}</span> →
        </i>
      </span>
    </Link>
  )
}
