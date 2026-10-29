import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { approveClaim, completeClaim, fetchAdminClaim, fetchAdminClaims, rejectClaim } from '../../api/admin'
import type { Claim, ClaimStatus, ClaimType } from '../../api/types'
import Panel from '../../components/admin/Panel'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { CLAIM_REASON_LABEL, CLAIM_STATUS_LABEL, CLAIM_TYPE_LABEL, formatDate, formatPrice } from '../../lib/format'
import { Pager } from './AdminOrdersPage'

const KEY = ['admin', 'claims'] as const
const COURIERS = ['CJ대한통운', '우체국택배', '한진택배', '롯데택배', '로젠택배']

const STATUS_TABS: { value: ClaimStatus | ''; label: string }[] = [
  { value: 'REQUESTED', label: '접수' },
  { value: 'APPROVED', label: '처리 중' },
  { value: 'COMPLETED', label: '완료' },
  { value: '', label: '전체' },
]

const statusCls = (s: ClaimStatus) =>
  s === 'REQUESTED' ? 'text-beet-700' : s === 'APPROVED' ? 'text-sky-700' : s === 'COMPLETED' ? 'text-emerald-700' : 'text-neutral-400'

/** 취소 · 반품 · 교환 — 접수가 기본 탭 */
export function AdminClaimsPage() {
  const [params, setParams] = useSearchParams()
  // 주소에 없으면 접수, ALL 이면 전체
  const rawStatus = params.get('status')
  const status = (rawStatus === null ? 'REQUESTED' : rawStatus === 'ALL' ? '' : rawStatus) as ClaimStatus | ''
  const type = (params.get('type') ?? '') as ClaimType | ''
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, status, type, page], queryFn: () => fetchAdminClaims(status, type, page) })
  const go = (next: { status?: string; type?: string }) => {
    const s = next.status ?? status
    const t = next.type ?? type
    setParams({ ...(s !== 'REQUESTED' ? { status: s || 'ALL' } : {}), ...(t ? { type: t } : {}) })
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">취소 · 반품 · 교환</h1>
        <p className="mt-1 text-sm text-neutral-500">
          취소 요청은 승인하면 바로 취소 · 환불돼요. 반품 · 교환은 승인(회수) → 완료(환불 · 재발송) 두 단계예요. 처리할 때마다 고객에게 메일이 가요.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1" role="tablist">
          {STATUS_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={status === t.value}
              onClick={() => go({ status: t.value })}
              className={`rounded-lg px-3 py-1.5 text-sm ${status === t.value ? 'bg-neutral-900 font-semibold text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select className={inputClass} value={type} onChange={(e) => go({ type: e.target.value })} aria-label="종류">
          <option value="">모든 종류</option>
          {(Object.keys(CLAIM_TYPE_LABEL) as ClaimType[]).map((t) => (
            <option key={t} value={t}>
              {CLAIM_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <Panel>
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">{status === 'REQUESTED' ? '새로 접수된 신청이 없어요.' : '신청이 없어요.'}</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">종류</th>
                  <th className="pb-2 font-medium">주문 · 회원</th>
                  <th className="pb-2 font-medium">이유</th>
                  <th className="pb-2 text-right font-medium">환불 예정</th>
                  <th className="pb-2 pl-6 font-medium">상태</th>
                  <th className="hidden pb-2 font-medium sm:table-cell">신청</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.content.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3">
                      <Link to={`/admin/claims/${c.id}`} className="font-semibold hover:underline">
                        {CLAIM_TYPE_LABEL[c.type]}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="tabular-nums">{c.orderNumber}</span>
                      <span className="block text-xs text-neutral-500">{c.memberName}</span>
                    </td>
                    <td className="py-3 text-neutral-600">{CLAIM_REASON_LABEL[c.reason]}</td>
                    <td className="py-3 text-right tabular-nums">{c.type === 'EXCHANGE' ? '-' : formatPrice(c.refundAmount)}</td>
                    <td className={`py-3 pl-6 text-xs font-bold ${statusCls(c.status)}`}>{CLAIM_STATUS_LABEL[c.status]}</td>
                    <td className="hidden py-3 text-neutral-500 sm:table-cell">{formatDate(c.createdAt)}</td>
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

/** /admin/claims/:id — 승인 · 거절 · 완료 */
export function AdminClaimDetailPage() {
  const id = Number(useParams().id)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, 'detail', id], queryFn: () => fetchAdminClaim(id) })
  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  return <ClaimDetail key={data.id} claim={data} />
}

function ClaimDetail({ claim: c }: { claim: Claim }) {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [courier, setCourier] = useState(COURIERS[0])
  const [tracking, setTracking] = useState('')
  const done = (saved: Claim) => {
    queryClient.setQueryData([...KEY, 'detail', c.id], saved)
    queryClient.invalidateQueries({ queryKey: KEY, predicate: (q) => q.queryKey[2] !== 'detail' })
    queryClient.invalidateQueries({ queryKey: ['admin', 'claims-requested'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    setRejecting(false)
  }
  const approve = useMutation({ mutationFn: () => approveClaim(c.id), onSuccess: done })
  const reject = useMutation({ mutationFn: () => rejectClaim(c.id, rejectReason), onSuccess: done })
  const complete = useMutation({
    mutationFn: () => completeClaim(c.id, c.type === 'EXCHANGE' ? { courier, trackingNumber: tracking } : undefined),
    onSuccess: done,
  })
  const busy = approve.isPending || reject.isPending || complete.isPending
  const err = approve.error ?? reject.error ?? complete.error
  const open = c.status === 'REQUESTED' || c.status === 'APPROVED'

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/claims" className="text-sm text-neutral-500 hover:underline">
          ← 취소 · 반품 · 교환
        </Link>
        <h1 className="mt-1 text-2xl font-bold">
          {CLAIM_TYPE_LABEL[c.type]} <span className={`ml-2 text-base ${statusCls(c.status)}`}>{CLAIM_STATUS_LABEL[c.status]}</span>
        </h1>
        <p className="mt-1 text-sm text-neutral-500">{formatDate(c.createdAt)} 신청</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="신청 내용">
          <p className="text-sm font-semibold">{CLAIM_REASON_LABEL[c.reason]}</p>
          <p className="mt-2 text-[15px] leading-relaxed break-keep whitespace-pre-line">{c.detail}</p>
          {c.imageUrls.length > 0 && (
            <div className="mt-3 flex gap-2">
              {c.imageUrls.map((u) => (
                <a key={u} href={u} target="_blank" rel="noreferrer">
                  <img src={u} alt="신청 사진" className="h-24 w-24 rounded-lg border object-cover" />
                </a>
              ))}
            </div>
          )}
          {c.rejectReason && <p className="mt-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm">거절 사유: {c.rejectReason}</p>}
          {c.exchangeTrackingNumber && (
            <p className="mt-4 text-sm">
              교환 발송: {c.exchangeCourier} {c.exchangeTrackingNumber}
            </p>
          )}
        </Panel>
        <Panel title="주문 · 환불">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">주문</dt>
              <dd>
                <Link to={`/admin/orders/${c.orderNumber}`} className="tabular-nums hover:underline">
                  {c.orderNumber}
                </Link>{' '}
                <OrderStatusBadge status={c.orderStatus} />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">회원</dt>
              <dd className="text-right">
                {c.memberId ? (
                  <Link to={`/admin/members/${c.memberId}`} className="hover:underline">
                    {c.memberName}
                  </Link>
                ) : (
                  c.memberName
                )}
                <span className="block text-xs text-neutral-500">{c.memberEmail}</span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">결제 금액</dt>
              <dd>{formatPrice(c.orderTotalPrice)}</dd>
            </div>
            {c.type !== 'EXCHANGE' && (
              <>
                {c.returnShippingFee > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">반품 배송비</dt>
                    <dd>−{formatPrice(c.returnShippingFee)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-100 pt-2 font-bold">
                  <dt>환불 {c.status === 'COMPLETED' ? '완료' : '예정'}</dt>
                  <dd>{formatPrice(c.refundAmount)}</dd>
                </div>
              </>
            )}
          </dl>
        </Panel>
      </div>

      {open && (
        <Panel title="처리">
          {err && (
            <div className="mb-3">
              <ErrorMessage error={err} />
            </div>
          )}
          {rejecting ? (
            <div className="space-y-2">
              <textarea
                className={`${inputClass} min-h-24 w-full`}
                maxLength={500}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="고객에게 메일로 가는 거절 사유예요."
              />
              <div className="flex gap-2">
                <Button disabled={busy || !rejectReason.trim()} onClick={() => reject.mutate()}>
                  거절하기
                </Button>
                <Button variant="secondary" onClick={() => setRejecting(false)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              {c.status === 'REQUESTED' && (
                <Button
                  disabled={busy}
                  onClick={() =>
                    window.confirm(
                      c.type === 'CANCEL' ? `주문을 취소하고 ${formatPrice(c.refundAmount)}을 환불할까요?` : '승인하고 회수를 진행할까요?',
                    ) && approve.mutate()
                  }
                >
                  {c.type === 'CANCEL' ? '승인 (취소 · 전액 환불)' : '승인 (회수 진행)'}
                </Button>
              )}
              {c.status === 'APPROVED' && c.type === 'RETURN' && (
                <Button disabled={busy} onClick={() => window.confirm(`회수를 확인했나요? ${formatPrice(c.refundAmount)}을 환불해요.`) && complete.mutate()}>
                  반품 완료 · {formatPrice(c.refundAmount)} 환불
                </Button>
              )}
              {c.status === 'APPROVED' && c.type === 'EXCHANGE' && (
                <>
                  <select className={inputClass} value={courier} onChange={(e) => setCourier(e.target.value)} aria-label="택배사">
                    {COURIERS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <input className={inputClass} placeholder="재발송 송장번호" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                  <Button disabled={busy || !tracking.trim()} onClick={() => complete.mutate()}>
                    교환 상품 발송 완료
                  </Button>
                </>
              )}
              <Button variant="ghost" className="ml-auto text-red-600 hover:bg-red-50" disabled={busy} onClick={() => setRejecting(true)}>
                거절
              </Button>
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
