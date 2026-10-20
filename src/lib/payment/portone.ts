import { completePortonePayment } from '../../api/payments'
import type { OrderDetail } from '../../api/types'
import { PORTONE } from './config'
import { PaymentError, type PaymentRequest } from './types'

/** 모바일은 결제 후 이 화면으로 돌아온다 (?paymentId=...&code=...&message=...) */
export const PORTONE_REDIRECT_PATH = '/payment/portone/redirect'

/**
 * 포트원 V2 결제창. paymentId 는 주문번호 그대로 — 같은 id 로 여러 번 시도할 수 있고 성공은 한 번뿐이다.
 * PC: 결과를 바로 받아 BE 에 완료를 알리고 주문을 돌려준다.
 * 모바일: 리디렉션되므로 이 Promise 는 끝나지 않는다(PortoneRedirectPage 가 이어받는다).
 */
export async function requestPortone(req: PaymentRequest, payMethod: 'CARD' | 'TRANSFER'): Promise<OrderDetail> {
  // SDK 는 결제할 때만 받는다 (첫 화면 번들에 넣지 않는다)
  const { requestPayment } = await import('@portone/browser-sdk/v2')
  const response = await requestPayment({
    storeId: PORTONE.storeId,
    channelKey: PORTONE.channelKey,
    paymentId: req.orderNumber,
    orderName: req.orderName,
    totalAmount: req.amount,
    currency: 'CURRENCY_KRW',
    payMethod,
    redirectUrl: `${window.location.origin}${PORTONE_REDIRECT_PATH}`,
    customer: { fullName: req.buyerName, email: req.buyerEmail },
  })

  if (response === undefined) return new Promise<never>(() => {}) // 리디렉션 중
  if (response.code !== undefined) throw new PaymentError(response.message || '결제가 취소되었어요.')
  return completePortonePayment(response.paymentId)
}
