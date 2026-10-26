import type { ReactNode } from 'react'

/** 관리자 화면 공통 카드 */
export default function Panel({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
