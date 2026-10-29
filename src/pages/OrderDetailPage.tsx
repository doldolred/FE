import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { cancelOrder, fetchOrder } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import type { OrderStatus } from '../api/types'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import PayMethodPicker from '../components/order/PayMethodPicker'
import CheckoutSteps from '../components/store/CheckoutSteps'
import MyNav from '../components/store/MyNav'
import ProductThumb from '../components/store/ProductThumb'
import Button from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { OrderClaimsSection } from './ClaimPages'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { usePayment } from '../hooks/usePayment'
import { CANCELLABLE_STATUSES, formatDate, formatPrice } from '../lib/format'
import { PAY_METHODS, PAYMENT_ENABLED, type PayMethod } from '../lib/payment'

/** 배송 진행 단계 — 취소 · 반품은 따로 표시 */
const FLOW: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING_PAYMENT', label: '결제 대기' },
  { status: 'PAID', label: '결제 완료' },
  { status: 'PREPARING', label: '상품 준비' },
  { status: 'SHIPPING', label: '배송중' },
  { status: 'DELIVERED', label: '배송 완료' },
]

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
  const step = FLOW.findIndex((f) => f.status === order.status)
  const ended = order.status === 'CANCELLED' || order.status === 'RETURNED'

  const handleCancel = () => {
    const msg = order.status === 'PAID' ? '주문을 취소하고 결제를 환불할까요?' : '주문을 취소할까요?'
    if (window.confirm(msg)) cancelMutation.mutate()
  }

  return (
    <div>
      {justOrdered ? (
        <>
          <CheckoutSteps current={2} />
          <div className="dd-hero-note pt-4!">
            <p className="big">Thank you!</p>
            <h1>{order.status === 'PAID' ? '결제가 완료되었어요' : '주문이 접수되었어요'}</h1>
            <p>주문번호 {order.orderNumber} · 평일 오후 3시 이전 결제 건은 오늘 보내 드려요.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/mypage/orders" className={buttonClass('secondary')}>
                주문 내역
              </Link>
              <Link to="/" className={buttonClass('primary')}>
                계속 둘러보기
              </Link>
            </div>
          </div>
        </>
      ) : (
        <MyNav />
      )}

      <div className="mx-auto max-w-3xl space-y-6">
        {/* 결제 대기 — 결제창을 닫았거나 실패했을 때 여기서 다시 결제 */}
        {awaitingPayment && (
          <section className="dd-box" data-tone="lime">
            <h2>결제를 기다리고 있어요</h2>
            <p className="text-sm">
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

        <section className="dd-box" data-tone="navy">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="dd-kicker text-xs tracking-[0.1em] text-[#f6d4cf]">ORDER · {order.orderNumber}</p>
              <h1 className="dd-display-ko mt-1 text-3xl">주문 상세</h1>
              <p className="mt-1 text-sm opacity-70">{formatDate(order.createdAt)} 주문</p>
            </div>
            <span className="rounded-full bg-white px-1 py-1">
              <OrderStatusBadge status={order.status} />
            </span>
          </div>
          {ended ? (
            <p className="mt-5 rounded-2xl border-2 border-white/40 px-4 py-3 text-sm font-bold">
              {order.status === 'CANCELLED' ? '취소된 주문이에요.' : '반품이 끝난 주문이에요.'}
            </p>
          ) : (
            <ol className="mt-6 grid grid-cols-5 gap-1 text-center text-[11px] font-black sm:text-xs" aria-label="배송 진행">
              {FLOW.map((f, i) => (
                <li key={f.status} aria-current={i === step ? 'step' : undefined}>
                  <span
                    className={`mx-auto mb-2 block h-3 rounded-full border-2 border-white ${i <= step ? 'bg-[#f6d4cf]' : 'bg-transparent opacity-40'}`}
                    aria-hidden="true"
                  />
                  <span className={i === step ? 'text-[#f6d4cf]' : i < step ? '' : 'opacity-50'}>{f.label}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="dd-box">
          <h2>주문 상품</h2>
          <ul className="dd-rows">
            {order.items.map((item) => (
              <li key={item.optionId} className="flex items-center gap-3 py-3 text-sm">
                <Link to={`/products/${item.productId}?option=${item.optionId}`} className="w-14 shrink-0">
                  <ProductThumb productId={item.productId} name={item.productName} className="rounded-xl!" />
                </Link>
                <Link to={`/products/${item.productId}?option=${item.optionId}`} className="min-w-0 flex-1 break-keep hover:underline">
                  <b>{item.productName}</b> {item.optionName} <span className="text-neutral-500">× {item.quantity}</span>
                </Link>
                <span className="font-black">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t-2 border-dashed border-[#222021]/25 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">상품 금액</dt>
              <dd className="font-bold">{formatPrice(order.itemsPrice)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between font-bold text-[#da1f2e]">
                <dt>할인{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                <dd>−{formatPrice(order.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-neutral-500">배송비</dt>
              <dd className="font-bold">{order.shippingFee === 0 ? '무료' : formatPrice(order.shippingFee)}</dd>
            </div>
          </dl>
          <div className="mt-3 flex items-end justify-between">
            <span className="font-black">총 결제 금액</span>
            <span className="dd-price-big">{formatPrice(order.totalPrice)}</span>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="dd-box">
            <h2>배송지</h2>
            <dl className="space-y-2 text-sm">
              <Row label="받는 분" value={`${order.receiverName} (${order.receiverPhone})`} />
              <Row label="주소" value={`[${order.zipcode}] ${order.address1} ${order.address2 ?? ''}`} />
              {order.memo && <Row label="메모" value={order.memo} />}
            </dl>
          </section>

          {payment ? (
            <section className="dd-box">
              <h2>결제 정보</h2>
              <dl className="space-y-2 text-sm">
                <Row label="결제 수단" value={methodLabel(payment.method)} />
                <Row label="결제 금액" value={formatPrice(payment.amount)} />
                <Row label="결제 일시" value={formatDate(payment.approvedAt)} />
                {payment.status !== 'PAID' && payment.cancelledAt && (
                  <>
                    <Row label="환불 금액" value={formatPrice(payment.cancelledAmount)} />
                    <Row label="환불 일시" value={formatDate(payment.cancelledAt)} />
                  </>
                )}
                {payment.receiptUrl && (
                  <div className="flex gap-4">
                    <dt className="w-16 shrink-0 text-neutral-500">영수증</dt>
                    <dd>
                      <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="font-bold underline">
                        영수증 보기
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          ) : (
            <section className="dd-box">
              <h2>결제 정보</h2>
              <p className="text-sm text-neutral-500">아직 결제 전이에요.</p>
            </section>
          )}
        </div>

        <OrderClaimsSection order={order} />

        {cancelMutation.error && <ErrorMessage error={cancelMutation.error} />}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/mypage/orders" className="text-sm font-bold underline underline-offset-4">
            ← 주문 내역
          </Link>
          <div className="flex flex-wrap gap-2">
            {order.status === 'DELIVERED' && (
              <Link to="/mypage/reviews" className={buttonClass('lime')}>
                후기 쓰기
              </Link>
            )}
            <Link to={`/mypage/inquiries/new?order=${order.orderNumber}`} className={buttonClass('secondary')}>
              이 주문 문의하기
            </Link>
            {CANCELLABLE_STATUSES.includes(order.status) && (
              <Button variant="secondary" onClick={handleCancel} disabled={cancelMutation.isPending}>
                주문 취소
              </Button>
            )}
          </div>
        </div>
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
      <dd className="font-medium break-keep">{value}</dd>
    </div>
  )
}
