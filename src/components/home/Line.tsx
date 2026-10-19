import type { CSSProperties, ReactNode } from 'react'

/**
 * 표제 한 줄 — 장면이 켜질 때 아래에서 올라오며 나타난다(index.css .line). 줄마다 i × 120ms 늦게.
 * <h1><Line>첫 줄</Line><Line i={1}>둘째 줄</Line></h1>
 */
export default function Line({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <span className="line">
      <span className="line-inner" style={{ '--line-delay': `${i * 120}ms` } as CSSProperties}>
        {children}
      </span>
    </span>
  )
}
