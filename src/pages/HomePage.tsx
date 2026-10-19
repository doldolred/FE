import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import Chapter from '../components/home/Chapter'
import Line from '../components/home/Line'
import ProcessScene from '../components/home/ProcessScene'
import Scene from '../components/home/Scene'
import SceneDots from '../components/home/SceneDots'
import ScrollFilm from '../components/home/ScrollFilm'
import ScrubText from '../components/home/ScrubText'
import { getErrorMessage } from '../lib/errors'
import { formatPrice } from '../lib/format'
import { CHAPTERS, MANIFESTO, PROMISES } from '../data/story'

/**
 * 메인 — 빅 히어로 + 스크롤 스토리텔링.
 *
 *   히어로     스크롤 필름의 첫 화면 — 큰 표제 · 구매 버튼 · 목차. 내리면 장면 문장이 하나씩 (ScrollFilm)
 *   01 비트    표제가 왼쪽에 붙잡히고 세 가지 약속이 스크롤에 따라 밝아진다 (Chapter + .scrub-in)
 *   02 과정    붙잡힌 무대 — 여섯 단계가 스크롤에 따라 켜진다 (ProcessScene)
 *   03 약속    선언문 — 낱말이 한 마디씩 읽힌다 (ScrubText)
 *   04 상품    상품 목록
 *   마지막     한 화면 — 구매 유도
 *
 * 문구 · 사진 자리는 data/story.ts. TODO(고객확인) 촬영본 — 지금 배경은 그라데이션 자리
 */
const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

const cta =
  'group inline-flex h-12 items-center gap-3 rounded-full bg-beet-500 pr-2 pl-6 text-sm font-semibold text-white transition-all duration-500 ease-soft hover:-translate-y-px hover:bg-beet-600 active:scale-[0.98] md:h-14 md:pl-7'
const ctaIcon =
  'flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 group-hover:translate-x-1'

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage() {
  const { data: products, isPending, error } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  const firstProduct = products?.[0]
  const buyHref = firstProduct ? `/products/${firstProduct.id}` : '#shop'

  return (
    <div className="story bg-ink text-cream">
      <div aria-hidden="true" className="page-progress" />
      <SceneDots />

      {/* ── 히어로 = 스크롤 필름의 첫 화면 ───────────────────── */}
      <ScrollFilm
        hero={
          <div className="mx-auto w-full max-w-6xl px-5 pb-24 md:px-10 md:pb-14">
            <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-beet-300">
              100% BEET JUICE · 국내산 비트
            </p>
            <h1 className="mt-5 text-5xl leading-[1.1] font-extrabold tracking-tight break-keep text-cream sm:text-6xl md:text-8xl">
              <Line>땅이 키운</Line>
              <Line i={1}>
                <em className="text-beet-300 not-italic">붉은</em> 한 포
              </Line>
            </h1>
            <p data-reveal style={delay(300)} className="mt-7 max-w-[40ch] text-base leading-relaxed break-keep text-cream/75 md:text-lg">
              비트만 그대로 짜낸 돌돌 비트즙. 매일 아침 한 포로 가볍게 시작하세요.
            </p>
            <div data-reveal style={delay(450)} className="mt-10 flex flex-wrap items-center gap-4">
              <Link to={buyHref} className={cta}>
                구매하기
                <span className={ctaIcon}>
                  <Arrow />
                </span>
              </Link>
              <a
                href="#process"
                className="inline-flex h-12 items-center text-sm text-cream/70 underline underline-offset-8 transition-colors duration-300 hover:text-cream"
              >
                어떻게 만드나요
              </a>
            </div>

            {/* 목차 — 이 아래로 이어지는 장들 */}
            <nav aria-label="목차" data-reveal style={delay(700)} className="mt-14 border-t border-cream/15 pt-5 md:mt-20">
              <ol className="flex flex-wrap gap-x-8 gap-y-2 md:gap-x-12">
                {CHAPTERS.map(([n, name, href]) => (
                  <li key={n}>
                    <a
                      href={href}
                      className="inline-flex min-h-8 items-baseline gap-2 text-xs text-cream/50 transition-colors duration-300 hover:text-beet-300"
                    >
                      <span className="font-bold tabular-nums">{n}</span>
                      <span className="tracking-[0.2em]">{name}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        }
      />

      {/* ── 01 비트 ─────────────────────────────────────────── */}
      <Chapter id="beet" n="01" en="THE BEET" label="비트" title={['물 한 방울 없이', '비트만 담았습니다']}>
        <ol className="flex flex-col">
          {PROMISES.map(([n, t, b]) => (
            <li key={n} className="scrub-in border-t border-cream/15 py-10 first:border-t-0 first:pt-0 md:py-14">
              <p className="text-lg font-bold text-beet-300 tabular-nums">{n}</p>
              <h3 className="mt-3 text-2xl font-bold text-cream md:text-4xl">{t}</h3>
              <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-cream/70 md:text-lg">{b}</p>
            </li>
          ))}
        </ol>
      </Chapter>

      {/* ── 02 과정 ─────────────────────────────────────────── */}
      <ProcessScene />

      {/* ── 03 약속 ─────────────────────────────────────────── */}
      <ScrubText id="promise" label="약속" en="03 — OUR PROMISE" text={MANIFESTO} />

      {/* ── 04 상품 ─────────────────────────────────────────── */}
      <Chapter id="shop" n="04" en="SHOP" label="상품" title={['오늘부터', '한 포씩']}>
        {isPending ? (
          <p className="text-cream/50">불러오는 중…</p>
        ) : error ? (
          <p role="alert" className="text-beet-200">
            {getErrorMessage(error)}
          </p>
        ) : products.length === 0 ? (
          <p className="text-cream/50">준비 중인 상품이 없어요.</p>
        ) : (
          <ul className="flex flex-col">
            {products.map((p) => (
              <li key={p.id} className="scrub-in">
                <Link
                  to={`/products/${p.id}`}
                  className="group flex items-baseline justify-between gap-4 border-b border-cream/15 py-6 transition-colors duration-500 hover:border-beet-300 md:py-8"
                >
                  <span className="text-2xl font-bold text-cream transition-[color,transform] duration-500 ease-soft group-hover:translate-x-2 group-hover:text-beet-300 md:text-4xl">
                    {p.name}
                  </span>
                  <span className="shrink-0 text-right text-sm text-cream/60 md:text-base">
                    {p.stock === 0 ? '품절' : formatPrice(p.price)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Chapter>

      {/* ── 마지막 한 화면 ──────────────────────────────────── */}
      <Scene id="start" label="시작" className="flex items-center">
        <div
          aria-hidden="true"
          className="scene-bg absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 45%, #5c1231 0%, #140a0e 70%)' }}
        />
        <div className="scene-text relative z-10 mx-auto w-full max-w-6xl px-5 py-24 text-center md:px-10">
          <p data-reveal className="text-xs font-semibold tracking-[0.3em] text-beet-300">
            START TOMORROW
          </p>
          <h2 className="mt-5 text-4xl leading-[1.15] font-extrabold tracking-tight break-keep text-cream md:text-7xl">
            <Line>내일 아침,</Line>
            <Line i={1}>첫 한 포</Line>
          </h2>
          <p data-reveal style={delay(240)} className="mx-auto mt-7 max-w-[36ch] text-sm leading-relaxed break-keep text-cream/70 md:text-base">
            오늘 주문하면 문 앞까지 보내 드립니다. 배송비는 무료예요.
          </p>
          <div data-reveal style={delay(360)} className="mt-10">
            <Link to={buyHref} className={cta}>
              돌돌 비트즙 구매하기
              <span className={ctaIcon}>
                <Arrow />
              </span>
            </Link>
          </div>
        </div>
      </Scene>
    </div>
  )
}
