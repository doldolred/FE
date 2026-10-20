import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { cancelOrder, fetchOrder } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import PayMethodPicker from '../components/order/PayMethodPicker'
import Button from '../components/ui/Button'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { usePayment } from '../hooks/usePayment'
import { CANCELLABLE_STATUSES, formatDate, formatPrice } from '../lib/format'
import { PAY_METHODS, PAYMENT_ENABLED, type PayMethod } from '../lib/payment'

export default function OrderDetailPage() {
  const orderNumber = useParams().orderNumber ?? ''
  const [params] = useSearchParams()
  const justOrdered = params.get('complete') === '1'
  const queryClient = useQueryClient()
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const { pay, paying } = usePayment()

  const { data: order, isPending, error } = useQuery({
    queryKey: queryKeys.order(orderNumber),
    queryFn: () => fetchOrder(orderNumber),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderNumber),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.order(orderNumber), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true })
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
    },
  })

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  const awaitingPayment = order.status === 'PENDING_PAYMENT'
  const payment = order.payment

  const handleCancel = () => {
    const msg = order.status === 'PAID' ? '주문을 취소하고 결제를 환불할까요?' : '주문을 취소할까요?'
    if (window.confirm(msg)) cancelMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {justOrdered && (
        <div className="rounded-2xl bg-beet-50 p-6 text-center">
          <p className="text-lg font-bold text-beet-800">
            {order.status === 'PAID' ? '결제가 완료되었어요!' : '주문이 접수되었어요!'}
          </p>
          <p className="mt-1 text-sm text-beet-700">주문번호 {order.orderNumber}</p>
        </div>
      )}

      {/* 결제 대기 — 결제창을 닫았거나 실패했을 때 여기서 다시 결제 */}
      {awaitingPayment && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-bold text-amber-800">결제를 기다리고 있어요</p>
          <p className="mt-1 text-sm text-amber-700">
            {PAYMENT_ENABLED
              ? '주문 후 30분 안에 결제하지 않으면 자동으로 취소되고 재고가 돌아가요.'
              : '결제 연동을 준비하고 있어요. 연동되면 여기서 결제할 수 있어요.'}
          </p>
          {PAYMENT_ENABLED && (
            <div className="mt-5 space-y-4">
              <PayMethodPicker value={payMethod} onChange={setPayMethod} disabled={paying} />
              <Button className="w-full" onClick={() => pay(order, payMethod)} disabled={paying}>
                {paying ? '결제 준비 중…' : `${formatPrice(order.totalPrice)} 결제하기`}
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">주문 상세</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(order.createdAt)} · {order.orderNumber}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section>
        <h2 className="mb-3 font-bold">주문 상품</h2>
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between px-4 py-3 text-sm">
              <Link to={`/products/${item.productId}`} className="hover:underline">
                {item.productName} <span className="text-neutral-500">× {item.quantity}</span>
              </Link>
              <span className="font-medium">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between px-1 font-bold">
          <span>총 결제 금액</span>
          <span className="text-beet-800">{formatPrice(order.totalPrice)}</span>
        </div>
      </section>

      {payment && (
        <section>
          <h2 className="mb-3 font-bold">결제 정보</h2>
          <dl className="space-y-2 rounded-xl bg-neutral-50 p-5 text-sm">
            <Row label="결제 수단" value={methodLabel(payment.method)} />
            <Row label="결제 금액" value={formatPrice(payment.amount)} />
            <Row label="결제 일시" value={formatDate(payment.approvedAt)} />
            {payment.receiptUrl && (
              <div className="flex gap-4">
                <dt className="w-16 shrink-0 text-neutral-500">영수증</dt>
                <dd>
                  <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-beet-800 underline">
                    영수증 보기
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">배송지</h2>
        <dl className="space-y-2 rounded-xl bg-neutral-50 p-5 text-sm">
          <Row label="받는 분" value={`${order.receiverName} (${order.receiverPhone})`} />
          <Row label="주소" value={`[${order.zipcode}] ${order.address1} ${order.address2 ?? ''}`} />
          {order.memo && <Row label="메모" value={order.memo} />}
        </dl>
      </section>

      {cancelMutation.error && <ErrorMessage error={cancelMutation.error} />}

      <div className="flex justify-between">
        <Link to="/mypage" className="text-sm text-neutral-500 hover:underline">
          ← 주문 내역
        </Link>
        {CANCELLABLE_STATUSES.includes(order.status) && (
          <Button variant="secondary" onClick={handleCancel} disabled={cancelMutation.isPending}>
            주문 취소
          </Button>
        )}
      </div>
    </div>
  )
}

/** PG 가 준 결제수단 코드(card · CARD · bank · TRANSFER …)를 화면 이름으로 */
function methodLabel(method: string | null) {
  if (!method) return '-'
  const m = PAY_METHODS.find((x) => x.nicepay === method.toLowerCase() || x.portone === method.toUpperCase())
  return m?.label ?? method
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-neutral-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
