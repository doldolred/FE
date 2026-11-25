import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { KAKAO_CHANNEL } from '../../data/company'

/**
 * 카카오톡 채널 추가 유도 (1차 수정 요청) — 채널을 추가하면 할인 쿠폰.
 *   KakaoBanner  메인의 안내 띠 (구매 띠 아래)
 *   KakaoFloat   모든 손님 화면 왼쪽 아래에 떠 있는 작은 알약 — 닫으면 이 브라우저에서는 다시 뜨지 않는다
 * 채널 주소(data/company.ts KAKAO_CHANNEL.url)가 비어 있으면 버튼은 눌리지 않고 "연결 전"으로 보인다.
 */

const Bubble = () => (
  <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 4.2c-4.7 0-8.5 2.95-8.5 6.6 0 2.36 1.6 4.43 4 5.6l-.83 3.02c-.07.27.23.48.47.33l3.63-2.38c.4.04.81.07 1.23.07 4.7 0 8.5-2.96 8.5-6.64S16.7 4.2 12 4.2Z"
    />
  </svg>
)

function ChannelLink({ className, children }: { className: string; children: React.ReactNode }) {
  if (!KAKAO_CHANNEL.url) {
    return (
      <span className={className} aria-disabled="true" title="채널 주소 연결 전">
        {children}
      </span>
    )
  }
  return (
    <a className={className} href={KAKAO_CHANNEL.url} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

export function KakaoBanner() {
  return (
    <section className="dd-kakao" data-tone="light" aria-label="카카오톡 채널 쿠폰">
      <div className="inner">
        <span className="mark">
          <Bubble />
        </span>
        <div className="copy">
          <p className="t">
            카카오톡 채널 추가하고 <b>{KAKAO_CHANNEL.coupon} 할인 쿠폰</b> 받기
          </p>
          <p className="s">
            채널을 추가한 분께 {KAKAO_CHANNEL.coupon} 할인 쿠폰을 드려요.
            {!KAKAO_CHANNEL.url && <em> (채널 주소 연결 전)</em>}
          </p>
        </div>
        <ChannelLink className="btn">채널 추가하기 →</ChannelLink>
      </div>
    </section>
  )
}

const DISMISS_KEY = 'dd-kakao-float-closed'

const wasClosed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function KakaoFloat() {
  const { pathname } = useLocation()
  const [closed, setClosed] = useState(wasClosed)
  // 결제 · 로그인 화면에서는 방해되지 않게 숨긴다
  if (closed || /^\/(checkout|login|signup|logout|oauth)/.test(pathname)) return null
  return (
    <div className="dd-kakaofloat" role="complementary" aria-label="카카오톡 채널 쿠폰">
      <ChannelLink className="go">
        <span className="mark">
          <Bubble />
        </span>
        <span>
          채널 추가 <b>{KAKAO_CHANNEL.coupon} 쿠폰</b>
        </span>
      </ChannelLink>
      <button
        type="button"
        aria-label="쿠폰 안내 닫기"
        onClick={() => {
          setClosed(true)
          try {
            localStorage.setItem(DISMISS_KEY, '1')
          } catch {
            // 저장이 막혀 있으면 이번 화면에서만 닫힌다
          }
        }}
      >
        ✕
      </button>
    </div>
  )
}
