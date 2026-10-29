import type { ClaimType, OrderDetail } from '../api/types'

/** 서버 설정(app.claim)과 같은 값 — 안내 문구용. 실제 판단 · 계산은 서버가 한다 */
export const RETURN_DAYS = 7
export const RETURN_SHIPPING_FEE = 6000

/** 이 주문에서 지금 신청할 수 있는 종류 (결제 대기 · 결제 완료는 신청 없이 바로 취소) */
export function claimableTypes(order: Pick<OrderDetail, 'status'>): ClaimType[] {
  if (order.status === 'PREPARING') return ['CANCEL']
  if (order.status === 'DELIVERED') return ['RETURN', 'EXCHANGE']
  return []
}
