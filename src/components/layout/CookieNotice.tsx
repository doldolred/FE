import { useState } from 'react'
import { Link } from 'react-router-dom'

const KEY = 'dd-cookie-notice'

const seen = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * 쿠키 안내 — 몰은 로그인 유지 같은 필수 쿠키 · 저장소만 쓰고 광고 · 분석 쿠키는 없어서(쿠키 정책)
 * 고를 것 없이 알리기만 한다. 광고 · 분석 도구를 붙이면 여기에 "동의 / 거부"를 넣고 동의 전에는 불러오지 않는다.
 */
export default function CookieNotice() {
  const [open, setOpen] = useState(() => !seen())
  if (!open) return null

  const close = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // 저장이 막힌 브라우저면 이번 화면에서만 닫는다
    }
    setOpen(false)
  }

  return (
    <div
      role="region"
      aria-label="쿠키 안내"
      className="fixed inset-x-3 bottom-3 z-[55] mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-2xl border-2 border-[#222021] bg-white px-4 py-3 text-sm text-[#222021] shadow-[4px_4px_0_#222021] sm:flex-nowrap"
    >
      <p className="flex-1 break-keep">
        돌돌은 로그인 유지 등 꼭 필요한 쿠키만 쓰고, 광고 · 추적 쿠키는 쓰지 않아요.{' '}
        <Link to="/cookies" className="font-bold underline underline-offset-2">
          쿠키 정책
        </Link>
      </p>
      <button type="button" onClick={close} className="shrink-0 rounded-full bg-[#222021] px-4 py-2 text-xs font-black text-white hover:bg-[#da1f2e]">
        확인
      </button>
    </div>
  )
}
