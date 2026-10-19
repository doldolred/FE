import type { OrderStatus } from '../../api/types'
import { ORDER_STATUS_LABEL } from '../../lib/format'

const colors: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
  PAID: 'bg-beet-50 text-beet-800',
  PREPARING: 'bg-sky-50 text-sky-700',
  SHIPPING: 'bg-sky-50 text-sky-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-neutral-100 text-neutral-500',
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>
      {ORDER_STATUS_LABEL[status]}
    </span>
  )
}
