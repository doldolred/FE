import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchAdminReviews, updateReview } from '../../api/admin'
import type { AdminReviewFilter, AdminReviewUpdate, Review } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { Stars } from '../../components/review/Stars'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { formatDate } from '../../lib/format'
import { Pager } from './AdminOrdersPage'

const KEY = ['admin', 'reviews'] as const

const TABS: { value: AdminReviewFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'NO_REPLY', label: '답글 없음' },
  { value: 'BEST', label: '베스트' },
  { value: 'HIDDEN', label: '숨김' },
]

/** 후기관리 — 숨김 · 베스트 · 돌돌 답글 */
export default function AdminReviewsPage() {
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') ?? 'ALL') as AdminReviewFilter
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, filter, page], queryFn: () => fetchAdminReviews(filter, page) })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">후기관리</h1>
        <p className="mt-1 text-sm text-neutral-500">
          숨긴 후기는 상품 상세 목록과 평점 요약에서 빠져요. 베스트는 베스트순 맨 위에 와요.
        </p>
      </div>

      <div className="flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={filter === t.value}
            onClick={() => {
              setParams(t.value === 'ALL' ? {} : { filter: t.value })
              setPage(0)
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${filter === t.value ? 'bg-neutral-900 font-semibold text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data.content.length === 0 ? (
        <Panel>
          <p className="py-10 text-center text-sm text-neutral-500">후기가 없어요.</p>
        </Panel>
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </div>
          <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
        </>
      )}
    </div>
  )
}

function ReviewRow({ review: r }: { review: Review }) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState(r.reply ?? '')
  const [editing, setEditing] = useState(false)
  const save = useMutation({
    mutationFn: (req: AdminReviewUpdate) => updateReview(r.id, req),
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })

  return (
    <section className={`rounded-2xl border bg-white p-5 ${r.hidden ? 'border-dashed border-neutral-300 opacity-70' : 'border-neutral-200'}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Stars value={r.rating} size={16} />
        {r.best && <span className="rounded bg-[#e6f05a] px-1.5 py-0.5 text-xs font-black text-[#16173d]">BEST</span>}
        {r.hidden && <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-xs font-bold text-neutral-600">숨김</span>}
        <span className="font-medium">{r.productName}</span>
        <span className="text-neutral-500">{r.optionName}</span>
        <span className="ml-auto text-xs text-neutral-500">{formatDate(r.createdAt)}</span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {r.memberId ? (
          <Link to={`/admin/members/${r.memberId}`} className="hover:underline">
            {r.author}
          </Link>
        ) : (
          r.author
        )}{' '}
        · {r.memberEmail}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed break-keep whitespace-pre-line">{r.content}</p>
      {r.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2">
          {r.imageUrls.map((u) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt="후기 사진" className="h-20 w-20 rounded-lg border border-neutral-200 object-cover" />
            </a>
          ))}
        </div>
      )}

      {editing ? (
        <div className="mt-4 space-y-2">
          <textarea
            className={`${inputClass} min-h-24 w-full`}
            maxLength={1000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="손님에게 보이는 돌돌 답글이에요. 비우고 저장하면 답글이 지워져요."
          />
          <div className="flex gap-2">
            <Button disabled={save.isPending} onClick={() => save.mutate({ reply })}>
              답글 저장
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setReply(r.reply ?? '')
                setEditing(false)
              }}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        r.reply && (
          <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm">
            <p className="text-xs font-bold text-neutral-500">돌돌 답글 · {r.repliedAt && formatDate(r.repliedAt)}</p>
            <p className="mt-1 whitespace-pre-line">{r.reply}</p>
          </div>
        )
      )}

      {save.error && (
        <div className="mt-3">
          <ErrorMessage error={save.error} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {r.reply ? '답글 고치기' : '답글 달기'}
          </Button>
        )}
        <Button variant="secondary" disabled={save.isPending} onClick={() => save.mutate({ best: !r.best })}>
          {r.best ? '베스트 빼기' : '베스트로'}
        </Button>
        <Button variant="ghost" className="ml-auto" disabled={save.isPending} onClick={() => save.mutate({ hidden: !r.hidden })}>
          {r.hidden ? '다시 보이기' : '숨기기'}
        </Button>
      </div>
    </section>
  )
}
