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
