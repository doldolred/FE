import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { cancelOrder, fetchOrder } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import Button from '../components/ui/Button'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { CANCELLABLE_STATUSES, formatDate, formatPrice } from '../lib/format'

export default function OrderDetailPage() {
  const orderNumber = useParams().orderNumber ?? ''
  const [params] = useSearchParams()
  const justOrdered = params.get('complete') === '1'
  const queryClient = useQueryClient()

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

  const handleCancel = () => {
    if (window.confirm('주문을 취소할까요?')) cancelMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {justOrdered && (
        <div className="rounded-2xl bg-beet-50 p-6 text-center">
          <p className="text-lg font-bold text-beet-800">주문이 접수되었어요!</p>
          <p className="mt-1 text-sm text-beet-700">주문번호 {order.orderNumber}</p>
        </div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-16 shrink-0 text-neutral-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
