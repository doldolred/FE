import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchMe } from '../api/auth'
import { fetchOrders } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { formatDate, formatPrice } from '../lib/format'

export default function MyPage() {
  const me = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe })
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: fetchOrders })

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>
        {me.isPending ? (
          <Loading />
        ) : me.error ? (
          <ErrorMessage error={me.error} />
        ) : (
          <dl className="grid gap-3 rounded-2xl bg-neutral-50 p-6 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-neutral-500">이름</dt>
              <dd className="mt-1 font-medium">{me.data.name}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">이메일</dt>
              <dd className="mt-1 font-medium">{me.data.email}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">휴대폰</dt>
              <dd className="mt-1 font-medium">{me.data.phone ?? '-'}</dd>
            </div>
          </dl>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">주문 내역</h2>
        {orders.isPending ? (
          <Loading />
        ) : orders.error ? (
          <ErrorMessage error={orders.error} />
        ) : orders.data.length === 0 ? (
          <Empty>아직 주문 내역이 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {orders.data.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  to={`/mypage/orders/${o.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-xs text-neutral-500">
                      {formatDate(o.createdAt)} · {o.orderNumber}
                    </p>
                    <p className="mt-1 font-medium">{o.itemSummary}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={o.status} />
                    <span className="font-semibold">{formatPrice(o.totalPrice)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
