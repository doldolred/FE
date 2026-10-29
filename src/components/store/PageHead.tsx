import type { ReactNode } from 'react'

/** 손님 화면 머리말 — 영문 작은 줄(비트색) + 큰 한글 제목 + 설명 (styles/store.css .dd-head) */
export default function PageHead({ kicker, title, sub, center }: { kicker: string; title: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <header className="dd-head" data-center={center ? '' : undefined}>
      <p className="kicker">DOLDOL · {kicker}</p>
      <h1>{title}</h1>
      {sub && <p className="sub">{sub}</p>}
    </header>
  )
}
