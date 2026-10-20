import type { OrderDetail } from '../../api/types'
import { PAY_METHODS, PAYMENT_PROVIDER, type PayMethod } from './config'
import { requestNicepay } from './nicepay'
import { requestPortone } from './portone'
import type { PaymentRequest } from './types'

export { PAY_METHODS, PAYMENT_ENABLED, PAYMENT_PROVIDER, type PayMethod } from './config'
export { PaymentError } from './types'

/** "돌돌 비트즙 30포 외 1건" */
export function orderNameOf(order: Pick<OrderDetail, 'items'>): string {
  const [first, ...rest] = order.items
  if (!first) return '돌돌 비트즙'
  return rest.length ? `${first.productName} 외 ${rest.length}건` : first.productName
}

/**
 * 이미 만든 주문(PENDING_PAYMENT)을 결제한다. PG 는 설정(VITE_PAYMENT_PROVIDER)으로 정해진다.
 *  - 승인까지 이 화면에서 끝나면(포트원 PC) 결제된 주문을 돌려준다
 *  - 페이지를 떠나는 방식(나이스페이 · 포트원 모바일)이면 Promise 가 끝나지 않는다
 *  - 창을 닫거나 실패하면 PaymentError
 */
export function startPayment(order: OrderDetail, method: PayMethod, buyer?: { name?: string; email?: string }) {
  const m = PAY_METHODS.find((x) => x.key === method) ?? PAY_METHODS[0]
  const req: PaymentRequest = {
    orderNumber: order.orderNumber,
    amount: order.totalPrice,
    orderName: orderNameOf(order),
    buyerName: buyer?.name,
    buyerEmail: buyer?.email,
  }
  return PAYMENT_PROVIDER === 'portone' ? requestPortone(req, m.portone) : requestNicepay(req, m.nicepay)
}
