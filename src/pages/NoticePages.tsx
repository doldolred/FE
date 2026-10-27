import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchNotice, fetchNotices } from '../api/notices'
import { queryKeys } from '../api/queryKeys'
import { NoticeArticle } from '../components/NoticeArticle'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { formatDay } from '../lib/format'

/** /notices — 공지사항 목록 (고정 먼저 → 최신순) */
export function NoticeListPage() {
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: queryKeys.notices(page), queryFn: () => fetchNotices(page) })

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-black tracking-[0.1em] text-[#e4002b] italic">DOLDOL · NOTICE</p>
      <h1 className="dd-display mt-2 text-5xl md:text-6xl">공지사항</h1>

      <div className="mt-8 border-t-2 border-neutral-900">
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">아직 공지가 없어요.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {data.content.map((n) => (
              <li key={n.id}>
                <Link to={`/notices/${n.id}`} className="flex items-baseline gap-3 py-5 transition-colors hover:bg-neutral-50 md:px-2">
                  {n.pinned && <span className="shrink-0 text-xs font-black text-[#e4002b]">공지</span>}
                  <span className="flex-1 font-bold break-keep">{n.title}</span>
                  <span className="shrink-0 text-xs text-neutral-500 tabular-nums">{formatDay(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          <button type="button" className="font-bold disabled:opacity-30" disabled={page <= 0} onClick={() => setPage(page - 1)}>
            ← 이전
          </button>
          <span className="tabular-nums text-neutral-500">
            {page + 1} / {data.totalPages}
          </span>
          <button type="button" className="font-bold disabled:opacity-30" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
            다음 →
          </button>
        </div>
      )}
    </div>
  )
}

/** /notices/:id — 공지 한 편 */
export function NoticeDetailPage() {
  const id = Number(useParams().id)
  const { data, isPending, error } = useQuery({
    queryKey: queryKeys.notice(id),
    queryFn: () => fetchNotice(id),
    enabled: Number.isInteger(id),
  })

  return (
    <div className="mx-auto max-w-3xl">
      {!Number.isInteger(id) ? (
        <ErrorMessage error={new Error('잘못된 공지 주소입니다.')} />
      ) : isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <NoticeArticle title={data.title} content={data.content} pinned={data.pinned} date={data.createdAt} />
      )}
      <Link to="/notices" className="dd-btn mt-12">
        목록으로
      </Link>
    </div>
  )
}
