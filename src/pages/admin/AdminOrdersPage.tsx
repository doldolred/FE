import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { changeOrderStatus, fetchAdminOrder, fetchAdminOrders, type AdminOrderSearch } from '../../api/admin'
import type { OrderStatus } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { inputClass } from '../../lib/admin'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import { Empty, ErrorMessage, Loading } from '../../components/ui/Status'
import { formatDate, formatPrice, ORDER_STATUS_LABEL } from '../../lib/format'

/** 서버 OrderStatus.canMoveTo 와 같은 규칙 — 앞으로만, 배송 전까지 취소 가능 */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}
const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]
/** 상태를 바꾸는 버튼 이름 */
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: '결제 완료 처리',
  PREPARING: '상품 준비 시작',
  SHIPPING: '발송 처리',
  DELIVERED: '배송 완료 처리',
}

export function AdminOrdersPage() {
  const [draft, setDraft] = useState<AdminOrderSearch>({ status: '', from: '', to: '', keyword: '' })
  const [search, setSearch] = useState<AdminOrderSearch>({ page: 0 })
  const { data, isPending, error, isFetching } = useQuery({
    queryKey: ['admin', 'orders', search],
    queryFn: () => fetchAdminOrders({ ...search, size: 20 }),
    placeholderData: keepPreviousData,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSearch({ ...draft, page: 0 })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">주문</h1>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <select className={inputClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as OrderStatus | '' })} aria-label="상태">
          <option value="">전체 상태</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input type="date" className={inputClass} value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} aria-label="시작일" />
        <span className="text-neutral-400">~</span>
        <input type="date" className={inputClass} value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} aria-label="종료일" />
        <input
          className={`${inputClass} min-w-56 flex-1`}
          placeholder="주문번호 · 받는 분 · 회원 이메일 · 이름"
          value={draft.keyword}
          onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
        />
        <Button type="submit">검색</Button>
      </form>

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data.content.length === 0 ? (
        <Empty>조건에 맞는 주문이 없어요.</Empty>
      ) : (
        <Panel>
          <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">주문일시 · 번호</th>
                  <th className="pb-2 font-medium">상품</th>
                  <th className="pb-2 font-medium">주문자 / 받는 분</th>
                  <th className="pb-2 text-right font-medium">금액</th>
                  <th className="pb-2 text-right font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.content.map((o) => (
                  <tr key={o.orderNumber} className="hover:bg-neutral-50">
                    <td className="py-3">
                      <Link to={`/admin/orders/${o.orderNumber}`} className="font-medium text-beet-800 hover:underline">
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-neutral-500">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="py-3">{o.itemSummary}</td>
                    <td className="py-3">
                      {o.memberName} <span className="text-xs text-neutral-500">{o.memberEmail}</span>
                      <p className="text-xs text-neutral-500">받는 분 {o.receiverName}</p>
                    </td>
                    <td className="py-3 text-right tabular-nums">{formatPrice(o.totalPrice)}</td>
                    <td className="py-3 text-right">
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={(page) => setSearch({ ...search, page })} />
        </Panel>
      )}
    </div>
  )
}

export function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
      <span>총 {total.toLocaleString()}건</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page <= 0} onClick={() => onPage(page - 1)}>
          이전
        </Button>
        <span className="tabular-nums">
          {page + 1} / {Math.max(1, totalPages)}
        </span>
        <Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => onPage(page + 1)}>
          다음
        </Button>
      </div>
    </div>
  )
}

const COURIERS = ['CJ대한통운', '우체국택배', '한진택배', '롯데택배', '로젠택배']

export function AdminOrderDetailPage() {
  const orderNumber = useParams().orderNumber ?? ''
  const queryClient = useQueryClient()
  const [courier, setCourier] = useState(COURIERS[0])
  const [tracking, setTracking] = useState('')
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'order', orderNumber], queryFn: () => fetchAdminOrder(orderNumber) })
  const mutation = useMutation({
    mutationFn: (status: OrderStatus) =>
      changeOrderStatus(orderNumber, status === 'SHIPPING' ? { status, courier, trackingNumber: tracking } : { status }),
    onSuccess: (res) => {
      queryClient.setQueryData(['admin', 'order', orderNumber], res)
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  const o = data.order

  const move = (status: OrderStatus) => {
    if (status === 'CANCELLED' && !window.confirm(o.status === 'PENDING_PAYMENT' ? '주문을 취소할까요?' : '주문을 취소하고 결제를 환불할까요?')) return
    mutation.mutate(status)
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/orders" className="text-sm text-neutral-500 hover:underline">
        ← 주문 목록
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{o.orderNumber}</h1>
        <OrderStatusBadge status={o.status} />
        <span className="text-sm text-neutral-500">{formatDate(o.createdAt)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Panel title="주문 상품">
            <ul className="divide-y divide-neutral-100 text-sm">
              {o.items.map((i) => (
                <li key={i.optionId} className="flex justify-between py-2">
                  <span>
                    {i.productName} {i.optionName} <span className="text-neutral-500">× {i.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-neutral-100 pt-3 text-sm">
              <Row label="상품 금액" value={formatPrice(o.itemsPrice)} />
              {o.discountAmount > 0 && <Row label={`할인 (${o.couponCode ?? ''})`} value={`−${formatPrice(o.discountAmount)}`} />}
              <Row label="배송비" value={o.shippingFee === 0 ? '무료' : formatPrice(o.shippingFee)} />
              <Row label="결제 금액" value={formatPrice(o.totalPrice)} strong />
            </dl>
          </Panel>
          <Panel title="주문자 · 배송지">
            <dl className="space-y-1 text-sm">
              <Row label="주문 회원" value={`${data.memberName} (${data.memberEmail})`} />
              <Row label="받는 분" value={`${o.receiverName} · ${o.receiverPhone}`} />
              <Row label="주소" value={`[${o.zipcode}] ${o.address1} ${o.address2 ?? ''}`} />
              {o.memo && <Row label="메모" value={o.memo} />}
            </dl>
          </Panel>
          {o.payment && (
            <Panel title="결제">
              <dl className="space-y-1 text-sm">
                <Row label="상태" value={o.payment.status === 'CANCELLED' ? '환불됨' : '결제 완료'} />
                <Row label="수단" value={o.payment.method ?? '-'} />
                <Row label="금액" value={formatPrice(o.payment.amount)} />
                <Row label="승인" value={formatDate(o.payment.approvedAt)} />
                {o.payment.cancelledAt && <Row label="환불" value={formatDate(o.payment.cancelledAt)} />}
              </dl>
            </Panel>
          )}
        </div>

        <Panel title="상태 변경">
          {data.courier && (
            <p className="mb-4 rounded-lg bg-neutral-50 px-3 py-2 text-sm">
              {data.courier} · {data.trackingNumber}
              {data.shippedAt && <span className="block text-xs text-neutral-500">발송 {formatDate(data.shippedAt)}</span>}
              {data.deliveredAt && <span className="block text-xs text-neutral-500">배송 완료 {formatDate(data.deliveredAt)}</span>}
            </p>
          )}
          {NEXT[o.status].length === 0 ? (
            <p className="text-sm text-neutral-500">더 바꿀 수 있는 상태가 없어요.</p>
          ) : (
            <div className="space-y-3">
              {NEXT[o.status].includes('SHIPPING') && (
                <div className="space-y-2 rounded-xl border border-neutral-200 p-3">
                  <select className={`${inputClass} w-full`} value={courier} onChange={(e) => setCourier(e.target.value)} aria-label="택배사">
                    {COURIERS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <input className={`${inputClass} w-full`} placeholder="송장번호" value={tracking} onChange={(e) => setTracking(e.target.value)} />
                </div>
              )}
              {NEXT[o.status].map((s) => (
                <Button
                  key={s}
                  variant={s === 'CANCELLED' ? 'secondary' : 'primary'}
                  className="w-full"
                  disabled={mutation.isPending || (s === 'SHIPPING' && !tracking.trim())}
                  onClick={() => move(s)}
                >
                  {s === 'CANCELLED' ? (o.status === 'PENDING_PAYMENT' ? '주문 취소' : '주문 취소 · 환불') : ACTION_LABEL[s]}
                </Button>
              ))}
              {o.status === 'PENDING_PAYMENT' && <p className="text-xs text-neutral-500">결제완료는 무통장 입금 등을 직접 확인했을 때만 누르세요.</p>}
            </div>
          )}
          {mutation.error && (
            <div className="mt-3">
              <ErrorMessage error={mutation.error} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex gap-4 ${strong ? 'font-bold' : ''}`}>
      <dt className="w-20 shrink-0 text-neutral-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
