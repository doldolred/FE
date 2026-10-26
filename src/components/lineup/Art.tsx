import type { ArtKind } from '../../data/lineup'

/**
 * 출시 예정 제품 그림 (프로토타입 v4 의 SVG — 무채색 + 포인트 레드로 다시 칠함).
 * 실제 제품 사진이 생기면 사진으로 바꾼다.
 */
export function ProductArt({ kind }: { kind: ArtKind }) {
  return kind === 'bottle' ? <Bottle /> : <Jar />
}

function Bottle() {
  return (
    <svg viewBox="0 0 120 300" aria-hidden="true">
      <defs>
        <linearGradient id="dd-bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#1a0006" />
          <stop offset=".3" stopColor="#5e0012" />
          <stop offset=".55" stopColor="#8a001a" />
          <stop offset="1" stopColor="#14000a" />
        </linearGradient>
      </defs>
      <rect x="42" y="4" width="36" height="30" rx="5" fill="#111" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={45 + i * 4.6} y="8" width="1.4" height="22" fill="#fff" opacity=".18" />
      ))}
      <path
        d="M46 34 h28 v26 q0 12 18 26 q14 10 14 30 v168 q0 12 -12 12 H26 q-12 0 -12 -12 V116 q0 -20 14 -30 q18 -14 18 -26 z"
        fill="url(#dd-bt-glass)"
      />
      <path d="M24 120 v150" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".22" />
      <rect x="14" y="150" width="92" height="96" fill="#fff" />
      <text x="60" y="176" textAnchor="middle" fontWeight="900" fontStyle="italic" fontSize="9" letterSpacing="2" fill="#e4002b">
        DOLDOL
      </text>
      <text x="60" y="200" textAnchor="middle" fontWeight="900" fontSize="18" letterSpacing="-0.5" fill="#111">
        BEET
      </text>
      <text x="60" y="218" textAnchor="middle" fontWeight="900" fontSize="13" letterSpacing="-0.5" fill="#111">
        EXTRACT
      </text>
      <text x="60" y="236" textAnchor="middle" fontWeight="800" fontSize="8.5" fill="#e4002b">
        비트 농축액 · 500ml
      </text>
    </svg>
  )
}

function Jar() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true">
      <defs>
        <linearGradient id="dd-jr-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#ececec" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#e2e2e2" />
        </linearGradient>
        <linearGradient id="dd-jr-powder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff3355" />
          <stop offset="1" stopColor="#a8001f" />
        </linearGradient>
      </defs>
      <rect x="26" y="6" width="148" height="34" rx="8" fill="#111" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={32 + i * 8} y="10" width="2" height="26" fill="#fff" opacity=".14" />
      ))}
      <rect x="18" y="40" width="164" height="172" rx="22" fill="url(#dd-jr-glass)" />
      <path d="M24 92 q76 -16 152 0 V190 q0 16 -16 16 H40 q-16 0 -16 -16 z" fill="url(#dd-jr-powder)" />
      <rect x="34" y="100" width="132" height="76" rx="6" fill="#fff" />
      <text x="100" y="122" textAnchor="middle" fontWeight="900" fontStyle="italic" fontSize="10" letterSpacing="2" fill="#e4002b">
        DOLDOL
      </text>
      <text x="100" y="148" textAnchor="middle" fontWeight="900" fontSize="21" letterSpacing="-0.8" fill="#111">
        BEET POWDER
      </text>
      <text x="100" y="166" textAnchor="middle" fontWeight="800" fontSize="10" fill="#e4002b">
        비트 파우더 · 150g
      </text>
      <path d="M34 54 v128" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

/** 통비트 (잎 달린 뿌리) */
export function Beetroot() {
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true">
      <path d="M60 62c-26 0-44 18-44 40 0 24 20 40 44 46 24-6 44-22 44-46 0-22-18-40-44-40z" fill="#b8002a" />
      <path d="M60 62c-26 0-44 18-44 40 0 24 20 40 44 46" fill="#5c0012" opacity=".4" />
      <path d="M42 90q8-6 18-6" stroke="#ff8a9c" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
      <g stroke="#7a0018" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M58 64C54 46 44 34 30 24" />
        <path d="M60 62c0-20 4-36 12-50" />
        <path d="M62 64c6-14 16-24 30-30" />
      </g>
      <g fill="#3d7a35">
        <path d="M30 24c-14-6-22-2-24 6 8 6 18 6 24-6z" />
        <path d="M72 12c-2-10 6-14 14-12-2 10-8 14-14 12z" />
        <path d="M92 34c6-10 16-12 22-6-6 8-14 10-22 6z" />
      </g>
    </svg>
  )
}

/** 비트 단면 한 조각 */
export function BeetSlice() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#c4002a" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#ff9aab" />
      <circle cx="20" cy="20" r="8" fill="none" stroke="#ff9aab" />
      <circle cx="20" cy="20" r="3" fill="#ff9aab" />
    </svg>
  )
}

/** 찢어진 종이 경계 모양 (seed 가 같으면 같은 모양) */
export function TornEdge({ seed, color }: { seed: number; color: string }) {
  return (
    <svg className="dd-torn" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
      <path d={tornPath(seed)} fill={color} />
    </svg>
  )
}

function tornPath(seed: number) {
  let x = 0
  let r = seed
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280
  let d = `M0 110 L0 ${(40 + rnd() * 30).toFixed(1)}`
  while (x < 1440) {
    x += 18 + rnd() * 46
    d += ` L${Math.min(1440, x).toFixed(1)} ${(18 + rnd() * 70).toFixed(1)}`
  }
  return d + ' L1440 110 Z'
}
