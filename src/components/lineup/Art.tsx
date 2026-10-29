import type { ArtKind } from '../../data/lineup'

/** 병 · 유리병 그림 (프로토타입 v4 원본 SVG). 파우치는 SvgPouch */
export function ProductArt({ kind }: { kind: Exclude<ArtKind, 'pouch'> }) {
  return kind === 'bottle' ? <Bottle /> : <Jar />
}

// 농축액 — 진한 유리병
function Bottle() {
  return (
    <svg viewBox="0 0 120 300" aria-hidden="true">
      <defs>
        <linearGradient id="bt-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#2a0613" />
          <stop offset=".3" stopColor="#6a0c2f" />
          <stop offset=".55" stopColor="#a3141f" />
          <stop offset="1" stopColor="#240511" />
        </linearGradient>
      </defs>
      <rect x="42" y="4" width="36" height="30" rx="5" fill="#222021" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={45 + i * 4.6} y="8" width="1.4" height="22" fill="#fff" opacity=".18" />
      ))}
      <path
        d="M46 34 h28 v26 q0 12 18 26 q14 10 14 30 v168 q0 12 -12 12 H26 q-12 0 -12 -12 V116 q0 -20 14 -30 q18 -14 18 -26 z"
        fill="url(#bt-glass)"
      />
      <path d="M24 120 v150" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".22" />
      <rect x="14" y="150" width="92" height="96" fill="#f6eee9" />
      <text x="60" y="176" textAnchor="middle" fontFamily="Archivo" fontStyle="italic" fontWeight="900" fontSize="9" letterSpacing="2" fill="#a3141f">
        DOLDOL
      </text>
      <text x="60" y="200" textAnchor="middle" fontFamily="Anton, Archivo" fontSize="18" fill="#222021">
        BEET
      </text>
      <text x="60" y="218" textAnchor="middle" fontFamily="Anton, Archivo" fontSize="14" fill="#222021">
        EXTRACT
      </text>
      <text x="60" y="236" textAnchor="middle" fontFamily="Pretendard Variable, Pretendard" fontWeight="800" fontSize="8.5" fill="#a3141f">
        비트 농축액 · 500ml
      </text>
    </svg>
  )
}

// 파우더 — 넓은 유리통
function Jar() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true">
      <defs>
        <linearGradient id="jr-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#f7d6e2" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#f1c3d4" />
        </linearGradient>
        <linearGradient id="jr-powder" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#e2457e" />
          <stop offset="1" stopColor="#9e1548" />
        </linearGradient>
      </defs>
      <rect x="26" y="6" width="148" height="34" rx="8" fill="#222021" />
      {Array.from({ length: 18 }, (_, i) => (
        <rect key={i} x={32 + i * 8} y="10" width="2" height="26" fill="#fff" opacity=".14" />
      ))}
      <rect x="18" y="40" width="164" height="172" rx="22" fill="url(#jr-glass)" />
      <path d="M24 92 q76 -16 152 0 V190 q0 16 -16 16 H40 q-16 0 -16 -16 z" fill="url(#jr-powder)" />
      <rect x="34" y="100" width="132" height="76" rx="6" fill="#fff" />
      <text x="100" y="122" textAnchor="middle" fontFamily="Archivo" fontStyle="italic" fontWeight="900" fontSize="10" letterSpacing="2" fill="#222021">
        DOLDOL
      </text>
      <text x="100" y="148" textAnchor="middle" fontFamily="Anton, Archivo" fontSize="24" fill="#222021">
        BEET POWDER
      </text>
      <text x="100" y="166" textAnchor="middle" fontFamily="Pretendard Variable, Pretendard" fontWeight="800" fontSize="10" fill="#a3141f">
        비트 파우더 · 150g
      </text>
      <path d="M34 54 v128" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".5" />
    </svg>
  )
}

/** 통비트 (1번 장면에서 떨어지는 것) */
export function Beetroot() {
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true">
      <path d="M60 62c-26 0-44 18-44 40 0 24 20 40 44 46 24-6 44-22 44-46 0-22-18-40-44-40z" fill="#b0154f" />
      <path d="M60 62c-26 0-44 18-44 40 0 24 20 40 44 46" fill="#7a0f37" opacity=".45" />
      <path d="M42 90q8-6 18-6" stroke="#ff8db5" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M60 148v2" stroke="#7a0f37" strokeWidth="3" />
      <g stroke="#a3141f" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M58 64C54 46 44 34 30 24" />
        <path d="M60 62c0-20 4-36 12-50" />
        <path d="M62 64c6-14 16-24 30-30" />
      </g>
      <g fill="#4f9a3f">
        <path d="M30 24c-14-6-22-2-24 6 8 6 18 6 24-6z" />
        <path d="M72 12c-2-10 6-14 14-12-2 10-8 14-14 12z" />
        <path d="M92 34c6-10 16-12 22-6-6 8-14 10-22 6z" />
      </g>
    </svg>
  )
}

/** 받침대 위 통비트 (조금 더 진한 색) */
export function BeetShape() {
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true">
      <path d="M60 62c-26 0-44 18-44 40 0 24 20 40 44 46 24-6 44-22 44-46 0-22-18-40-44-40z" fill="#9e1548" />
      <path d="M42 90q8-6 18-6" stroke="#ff8db5" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
      <g stroke="#7a0f37" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M58 64C54 46 44 34 30 24" />
        <path d="M60 62c0-20 4-36 12-50" />
        <path d="M62 64c6-14 16-24 30-30" />
      </g>
      <g fill="#4f9a3f">
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
      <circle cx="20" cy="20" r="18" fill="#c0265f" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="#f3a6c2" />
      <circle cx="20" cy="20" r="8" fill="none" stroke="#f3a6c2" />
      <circle cx="20" cy="20" r="3" fill="#f3a6c2" />
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
