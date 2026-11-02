import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createInquiry, deleteInquiry, fetchInquiries, fetchInquiry } from '../api/inquiries'
import { fetchOrders } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import type { InquiryCategory, InquiryStatus } from '../api/types'
import Button from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { COMPANY } from '../data/company'
import { getFieldErrors } from '../lib/errors'
import { formatDate, formatDay, INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS_LABEL } from '../lib/format'
import MyNav from '../components/store/MyNav'

const fieldClass =
  'w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-neutral-900'

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
        status === 'ANSWERED' ? 'bg-neutral-900 text-white' : 'border border-neutral-300 text-neutral-500'
      }`}
    >
      {INQUIRY_STATUS_LABEL[status]}
    </span>
  )
}

function Heading({ children }: { children: string }) {
  return (
    <div className="dd-head mb-0!">
      <p className="kicker">DOLDOL · 1:1 INQUIRY</p>
      <h1>{children}</h1>
    </div>
  )
}

/** /mypage/inquiries — 내 문의 목록 */
export function InquiryListPage() {
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: queryKeys.inquiries(page), queryFn: () => fetchInquiries(page) })

  return (
    <div className="mx-auto max-w-3xl">
      <MyNav />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading>1:1 문의</Heading>
          <p className="mt-3 text-sm text-neutral-600">답변이 달리면 가입하신 이메일로 알려 드려요.</p>
        </div>
        <Link to="/mypage/inquiries/new" className="dd-btn" data-primary="">
          문의하기
        </Link>
      </div>

      <div className="mt-8 border-t-2 border-neutral-900">
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <div className="py-10">
            <Empty>아직 남긴 문의가 없어요.</Empty>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {data.content.map((q) => (
              <li key={q.id}>
                <Link to={`/mypage/inquiries/${q.id}`} className="flex items-center gap-3 py-5 transition-colors hover:bg-neutral-50 md:px-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500">
                      {INQUIRY_CATEGORY_LABEL[q.category]} · {formatDay(q.createdAt)}
                    </p>
                    <p className="mt-1 truncate font-bold">{q.title}</p>
                  </div>
                  <InquiryStatusBadge status={q.status} />
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
          <span className="text-neutral-500 tabular-nums">
            {page + 1} / {data.totalPages}
          </span>
          <button type="button" className="font-bold disabled:opacity-30" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)}>
            다음 →
          </button>
        </div>
      )}

      <Link to="/mypage" className="mt-10 inline-block text-sm text-neutral-500 hover:underline">
        ← 마이페이지
      </Link>
    </div>
  )
}

const CATEGORIES = Object.keys(INQUIRY_CATEGORY_LABEL) as InquiryCategory[]

/** /mypage/inquiries/new — 문의하기. 주문 상세에서 오면 ?order=주문번호 가 미리 골라져 있다 */
export function InquiryNewPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: fetchOrders })
  const fromOrder = params.get('order') ?? ''
  const [form, setForm] = useState({
    category: (fromOrder ? 'ORDER' : '') as InquiryCategory | '',
    title: '',
    content: '',
    orderNumber: fromOrder,
  })

  const save = useMutation({
    mutationFn: () =>
      createInquiry({ category: form.category as InquiryCategory, title: form.title, content: form.content, orderNumber: form.orderNumber || undefined }),
    onSuccess: (q) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      navigate(`/mypage/inquiries/${q.id}`, { replace: true })
    },
  })
  const fieldErrors = getFieldErrors(save.error)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Heading>문의하기</Heading>
      <p className="mt-3 text-sm text-neutral-600">{COMPANY.csHours} — 차례대로 답변드려요. 답변이 달리면 이메일로 알려 드려요.</p>

      <form onSubmit={submit} className="mt-8 space-y-6 border-t-2 border-neutral-900 pt-8">
        <fieldset>
          <legend className="mb-2 text-sm font-extrabold">문의 종류</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <label
                key={c}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
                  form.category === c ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 hover:border-neutral-900'
                }`}
              >
                <input type="radio" name="category" className="sr-only" required checked={form.category === c} onChange={() => setForm({ ...form, category: c })} />
                {INQUIRY_CATEGORY_LABEL[c]}
              </label>
            ))}
          </div>
          {fieldErrors.category && <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>}
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">관련 주문 (선택)</span>
          <select className={fieldClass} value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}>
            <option value="">선택 안 함</option>
            {orders.data?.map((o) => (
              <option key={o.orderNumber} value={o.orderNumber}>
                {formatDay(o.createdAt)} · {o.itemSummary} ({o.orderNumber})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-extrabold">제목</span>
          <input className={fieldClass} required maxLength={100} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          {fieldErrors.title && <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>}
        </label>

        <label className="block">
          <span className="mb-2 flex justify-between text-sm font-extrabold">
            내용 <span className="font-normal text-neutral-400 tabular-nums">{form.content.length} / 5,000</span>
          </span>
          <textarea
            className={`${fieldClass} min-h-56 leading-relaxed`}
            required
            maxLength={5000}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="주문하신 분 성함 · 연락처 같은 개인정보는 적지 않아도 돼요. 로그인한 계정으로 확인해요."
          />
          {fieldErrors.content && <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>}
        </label>

        {save.error && !Object.keys(fieldErrors).length && <ErrorMessage error={save.error} />}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="dd-btn" data-primary="" disabled={save.isPending}>
            문의 남기기
          </button>
          <Link to="/mypage/inquiries" className="dd-btn">
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}

/** /mypage/inquiries/:id — 문의 한 건 + 답변 */
export function InquiryDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: queryKeys.inquiry(id), queryFn: () => fetchInquiry(id), enabled: Number.isInteger(id) })
  const remove = useMutation({
    mutationFn: () => deleteInquiry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      navigate('/mypage/inquiries', { replace: true })
    },
  })

  if (!Number.isInteger(id)) return <ErrorMessage error={new Error('잘못된 문의 주소입니다.')} />
  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="mx-auto max-w-3xl">
      <article>
        <header className="border-b-2 border-neutral-900 pb-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black tracking-[0.1em] text-[#da1f2e]">{INQUIRY_CATEGORY_LABEL[data.category]}</p>
            <InquiryStatusBadge status={data.status} />
          </div>
          <h1 className="mt-2 text-2xl leading-snug font-black tracking-[-0.02em] break-keep md:text-3xl">{data.title}</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {formatDate(data.createdAt)}
            {data.orderNumber && (
              <>
                {' · 주문 '}
                <Link to={`/mypage/orders/${data.orderNumber}`} className="underline">
                  {data.orderNumber}
                </Link>
              </>
            )}
          </p>
        </header>
        <div className="pt-6 text-[15px] leading-[1.85] break-keep whitespace-pre-line text-neutral-800">{data.content}</div>
      </article>

      <section className="mt-10 rounded-[22px] border-2 border-neutral-900 p-6 shadow-[6px_6px_0_#111]" aria-label="답변">
        {data.answer ? (
          <>
            <p className="flex items-center justify-between text-sm font-black">
              <span>
                돌돌 <span className="text-[#da1f2e]">답변</span>
              </span>
              {data.answeredAt && <span className="text-xs font-normal text-neutral-500">{formatDate(data.answeredAt)}</span>}
            </p>
            <div className="mt-4 text-[15px] leading-[1.85] break-keep whitespace-pre-line">{data.answer}</div>
          </>
        ) : (
          <p className="text-sm text-neutral-600">아직 답변을 준비하고 있어요. 답변이 달리면 이메일로 알려 드릴게요.</p>
        )}
      </section>

      {remove.error && (
        <div className="mt-4">
          <ErrorMessage error={remove.error} />
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link to="/mypage/inquiries" className="dd-btn">
          목록으로
        </Link>
        {data.status === 'WAITING' && (
          <Button
            variant="ghost"
            className="ml-auto text-neutral-500"
            disabled={remove.isPending}
            onClick={() => window.confirm('이 문의를 지울까요?') && remove.mutate()}
          >
            문의 삭제
          </Button>
        )}
        {data.status === 'ANSWERED' && (
          <Link to="/mypage/inquiries/new" className={buttonClass('ghost', 'ml-auto')}>
            새로 문의하기
          </Link>
        )}
      </div>
    </div>
  )
}
