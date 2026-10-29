import { formatDate } from '../lib/format'

/** 공지 한 편 — 손님 상세 화면과 관리자 미리보기가 같이 쓴다. 본문은 일반 글(줄바꿈 그대로) */
export function NoticeArticle({ title, content, pinned, date }: { title: string; content: string; pinned: boolean; date: string }) {
  return (
    <article>
      <header className="border-b-2 border-neutral-900 pb-5">
        {pinned && <p className="mb-2 text-xs font-black tracking-[0.1em] text-[#da1f2e]">공지</p>}
        <h1 className="text-2xl leading-snug font-black tracking-[-0.02em] break-keep md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">{formatDate(date)}</p>
      </header>
      <div className="pt-6 text-[15px] leading-[1.85] break-keep whitespace-pre-line text-neutral-800">{content}</div>
    </article>
  )
}
