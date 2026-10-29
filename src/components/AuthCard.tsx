import type { ReactNode } from 'react'
import PageHead from './store/PageHead'

/** 로그인 · 회원가입 · 비밀번호 화면 — 가운데 v4 카드. foot 은 카드 아래 라임 띠 (회원가입 · 로그인 바로 가기) */
export default function AuthCard({ title, kicker = 'MEMBER', sub, foot, children }: { title: string; kicker?: string; sub?: ReactNode; foot?: ReactNode; children: ReactNode }) {
  return (
    <div className="dd-auth">
      <PageHead kicker={kicker} title={title} sub={sub} center />
      <div className="dd-box">{children}</div>
      {foot && <div className="dd-auth-foot">{foot}</div>}
    </div>
  )
}
