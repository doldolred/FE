import { api } from './client'
import type { OrderDetail } from './types'

/** 포트원 결제가 끝났다고 BE 에 알린다 — BE 가 포트원에 금액 · 상태를 확인하고 주문을 PAID 로 */
export const completePortonePayment = (paymentId: string) =>
  api.post<OrderDetail>('/api/payments/portone/complete', { paymentId })
