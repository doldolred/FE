import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBanners } from '../../api/banners'
import { queryKeys } from '../../api/queryKeys'
import type { BannerTheme } from '../../api/types'
import { useReducedMotion } from '../../lib/useScroll'

/** 띠배너 높이 — 메인 첫 장면 글자들이 이만큼 내려간다 (--dd-banner, styles/lineup.css) */
export const BANNER_HEIGHT = 36

const THEME: Record<BannerTheme, string> = {
  RED: 'bg-[#da1f2e] text-white',
  BLACK: 'bg-neutral-950 text-white',
  WHITE: 'bg-white text-neutral-900 border-b border-neutral-200',
}

const ROTATE_MS = 4500
const CLOSED_KEY = 'dd-banner-closed'

interface StripProps {
  message: string
  linkUrl: string | null
  theme: BannerTheme
  onClose?: () => void
  /** 미리보기 — 링크를 실제로 열지 않는다 */
  preview?: boolean
}

/** 띠배너 한 줄 — 쇼핑몰 맨 위와 관리자 미리보기가 같이 쓴다 */
export function BannerStrip({ message, linkUrl, theme, onClose, preview = false }: StripProps) {
  const text = (
    <>
      {message}
      {linkUrl && <span aria-hidden="true"> →</span>}
    </>
  )
  const textClass = 'truncate px-10 text-xs font-bold tracking-[0.02em] sm:text-[13px]'
  return (
    <div className={`relative flex items-center justify-center ${THEME[theme]}`} style={{ height: BANNER_HEIGHT }}>
      {!linkUrl || preview ? (
        <p className={textClass}>{text}</p>
      ) : linkUrl.startsWith('/') ? (
        <Link to={linkUrl} className={`${textClass} hover:underline`}>
          {text}
        </Link>
      ) : (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className={`${textClass} hover:underline`}>
          {text}
        </a>
      )}
      {preview ? (
        // 미리보기 — 닫기 단추 모양만 (누를 수 없음)
        <span className="absolute right-2 flex h-8 w-8 items-center justify-center opacity-70" aria-hidden="true">
          <CloseIcon />
        </span>
      ) : (
        onClose && (
          <button type="button" onClick={onClose} aria-label="띠배너 닫기" className="absolute right-2 flex h-8 w-8 items-center justify-center opacity-70 hover:opacity-100">
            <CloseIcon />
          </button>
        )
      )}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function readClosed(): string | null {
  try {
    return sessionStorage.getItem(CLOSED_KEY)
  } catch {
    return null
  }
}

/**
 * 쇼핑몰 맨 위 띠배너 — 관리자가 켠 문구들(서버가 기간까지 걸러 준다)을 돌아가며 보여 준다.
 * 닫으면 이 탭을 닫을 때까지 안 보인다. 단, 문구 묶음이 바뀌면(새 배너) 다시 보인다.
 */
export default function TopBanner() {
  const { data: banners } = useQuery({ queryKey: queryKeys.banners, queryFn: fetchBanners, staleTime: 5 * 60_000 })
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [closedKey, setClosedKey] = useState(readClosed)

  const list = banners ?? []
  const key = list.map((b) => `${b.id}:${b.message}`).join('|')
  const visible = list.length > 0 && closedKey !== key

  // 여러 줄이면 돌아가며 (움직임 줄이기 설정이면 첫 줄만)
  useEffect(() => {
    if (!visible || list.length < 2 || reduced) return
    const t = window.setInterval(() => setIndex((i) => i + 1), ROTATE_MS)
    return () => window.clearInterval(t)
  }, [visible, list.length, reduced])

  // 메인 첫 장면의 글자 위치를 띠배너만큼 내린다
  useEffect(() => {
    const root = document.documentElement.style
    if (visible) root.setProperty('--dd-banner', `${BANNER_HEIGHT}px`)
    else root.removeProperty('--dd-banner')
    return () => {
      root.removeProperty('--dd-banner')
    }
  }, [visible])

  if (!visible) return null
  const banner = list[index % list.length]

  const close = () => {
    try {
      sessionStorage.setItem(CLOSED_KEY, key)
    } catch {
      // 저장이 막혀 있어도 이번 화면에서는 닫힌다
    }
    setClosedKey(key)
  }

  return (
    <div role="region" aria-label="알림" aria-live="polite">
      <div key={banner.id} className="animate-[dd-banner-in_500ms_var(--dd-ease)_both]">
        <BannerStrip message={banner.message} linkUrl={banner.linkUrl} theme={banner.theme} onClose={close} />
      </div>
    </div>
  )
}
