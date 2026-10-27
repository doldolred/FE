import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { answerInquiry, fetchAdminInquiries, fetchAdminInquiry } from '../../api/admin'
import type { AdminInquiry, InquiryStatus } from '../../api/types'
import Panel from '../../components/admin/Panel'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { formatDate, INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS_LABEL } from '../../lib/format'
import { Pager } from './AdminOrdersPage'

const KEY = ['admin', 'inquiries'] as const

const TABS: { value: InquiryStatus | ''; label: string }[] = [
  { value: 'WAITING', label: '답변 대기' },
  { value: 'ANSWERED', label: '답변 완료' },
  { value: '', label: '전체' },
]

function StatusText({ status }: { status: InquiryStatus }) {
  return (
    <span className={`text-xs font-bold ${status === 'WAITING' ? 'text-beet-700' : 'text-neutral-400'}`}>{INQUIRY_STATUS_LABEL[status]}</span>
  )
}

/** 문의함 — 답변 대기가 기본 탭 */
export function AdminInquiriesPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? 'WAITING') as InquiryStatus | ''
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, status, page], queryFn: () => fetchAdminInquiries(status, page) })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">문의함</h1>
        <p className="mt-1 text-sm text-neutral-500">회원이 남긴 1:1 문의예요. 처음 답변하면 회원에게 알림 메일이 가요.</p>
      </div>

      <div className="flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            onClick={() => {
              setParams(t.value === 'WAITING' ? {} : { status: t.value })
              setPage(0)
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${status === t.value ? 'bg-neutral-900 font-semibold text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Panel>
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">{status === 'WAITING' ? '답변을 기다리는 문의가 없어요.' : '문의가 없어요.'}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="w-36 pb-2 font-medium">종류</th>
                  <th className="pb-2 font-medium">제목</th>
                  <th className="hidden w-48 pb-2 font-medium md:table-cell">회원</th>
                  <th className="w-24 pb-2 font-medium">상태</th>
                  <th className="hidden w-44 pb-2 font-medium sm:table-cell">받은 때</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.content.map((q) => (
                  <tr key={q.id}>
                    <td className="py-3 text-neutral-600">{INQUIRY_CATEGORY_LABEL[q.category]}</td>
                    <td className="py-3">
                      <Link to={`/admin/inquiries/${q.id}`} className="font-medium hover:underline">
                        {q.title}
                      </Link>
                    </td>
                    <td className="hidden py-3 text-neutral-600 md:table-cell">
                      {q.memberName} <span className="text-xs text-neutral-400">{q.memberEmail}</span>
                    </td>
                    <td className="py-3">
                      <StatusText status={q.status} />
                    </td>
                    <td className="hidden py-3 text-neutral-500 sm:table-cell">{formatDate(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
          </>
        )}
      </Panel>
    </div>
  )
}

/** /admin/inquiries/:id — 문의 보기 · 답하기 */
export function AdminInquiryDetailPage() {
  const id = Number(useParams().id)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, 'detail', id], queryFn: () => fetchAdminInquiry(id) })

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  // key: 다른 문의로 옮겨 가면 입력칸을 그 문의 답변으로 새로 채운다
  return <InquiryDetail key={data.id} inquiry={data} />
}

function InquiryDetail({ inquiry: q }: { inquiry: AdminInquiry }) {
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState(q.answer ?? '')
  const [notice, setNotice] = useState('')
  const save = useMutation({
    mutationFn: () => answerInquiry(q.id, answer),
    onSuccess: (saved) => {
      // 처음 답한 거면 서버가 알림 메일을 보냈다 (q 는 아직 저장 전 값)
      setNotice(q.status === 'WAITING' ? '답변을 보냈어요. 회원에게 알림 메일이 갔어요.' : '답변을 고쳤어요.')
      queryClient.setQueryData([...KEY, 'detail', q.id], saved)
      queryClient.invalidateQueries({ queryKey: KEY, predicate: (query) => query.queryKey[2] !== 'detail' })
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries-waiting'] })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/inquiries" className="text-sm text-neutral-500 hover:underline">
          ← 문의함
        </Link>
        <h1 className="mt-1 text-2xl font-bold break-keep">{q.title}</h1>
        <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-neutral-500">
          <span>{INQUIRY_CATEGORY_LABEL[q.category]}</span>
          <StatusText status={q.status} />
          <span>{formatDate(q.createdAt)}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="문의 내용">
          <div className="text-[15px] leading-relaxed break-keep whitespace-pre-line">{q.content}</div>
        </Panel>
        <Panel title="회원 · 주문">
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-neutral-500">회원</dt>
              <dd>
                <Link to={`/admin/members/${q.memberId}`} className="font-medium hover:underline">
                  {q.memberName}
                </Link>
                <span className="block text-xs text-neutral-500">{q.memberEmail}</span>
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-neutral-500">주문</dt>
              <dd>
                {q.orderNumber ? (
                  <Link to={`/admin/orders/${q.orderNumber}`} className="font-medium tabular-nums hover:underline">
                    {q.orderNumber}
                  </Link>
                ) : (
                  <span className="text-neutral-400">없음</span>
                )}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel title={q.status === 'ANSWERED' ? '답변 (고치면 다시 저장)' : '답변하기'}>
        <form onSubmit={submit} className="space-y-3">
          <textarea
            className={`${inputClass} min-h-48 w-full leading-relaxed`}
            required
            maxLength={5000}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="회원에게 보이는 답변이에요. 줄바꿈은 그대로 보여요."
          />
          {save.error && <ErrorMessage error={save.error} />}
          {notice && !save.isPending && <p className="text-sm text-emerald-700">{notice}</p>}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-400">
              {q.answeredAt ? `마지막 답변 ${formatDate(q.answeredAt)}` : '처음 저장하면 회원에게 알림 메일이 가요.'}
            </span>
            <Button type="submit" disabled={save.isPending || !answer.trim()}>
              {q.status === 'ANSWERED' ? '답변 고치기' : '답변 보내기'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
