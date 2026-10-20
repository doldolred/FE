import { NICEPAY } from './config'
import { PaymentError, type PaymentRequest } from './types'

/** 나이스페이 JS SDK 가 window 에 붙이는 객체 (매뉴얼 common/api.md) */
interface AuthNice {
  requestPay(options: {
    clientId: string
    method: string
    orderId: string
    amount: number
    goodsName: string
    returnUrl: string
    fnError: (result: { errorMsg?: string; resultMsg?: string }) => void
    buyerName?: string
    buyerEmail?: string
    buyerTel?: string
  }): void
}

declare global {
  interface Window {
    AUTHNICE?: AuthNice
  }
}

let loading: Promise<AuthNice> | null = null

/** SDK 는 결제할 때 처음 한 번만 받는다 */
function loadSdk(): Promise<AuthNice> {
  if (window.AUTHNICE) return Promise.resolve(window.AUTHNICE)
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = NICEPAY.sdkUrl
    script.async = true
    script.onload = () => (window.AUTHNICE ? resolve(window.AUTHNICE) : reject(new PaymentError('결제 모듈을 불러오지 못했어요.')))
    script.onerror = () => {
      loading = null
      reject(new PaymentError('결제 모듈을 불러오지 못했어요. 네트워크를 확인해 주세요.'))
    }
    document.head.appendChild(script)
  })
  return loading
}

/**
 * 결제창을 띄운다. 인증이 끝나면 **브라우저가** 결과를 BE(returnUrl)로 form POST 하고,
 * BE 가 승인한 뒤 주문 상세(또는 실패 화면)로 돌려보낸다 — 그래서 성공하면 이 Promise 는 끝나지 않는다.
 * 창을 닫거나 오류가 나면 PaymentError 로 끝난다.
 */
export async function requestNicepay(req: PaymentRequest, method: string): Promise<never> {
  const sdk = await loadSdk()
  return new Promise<never>((_, reject) => {
    sdk.requestPay({
      clientId: NICEPAY.clientId,
      method,
      orderId: req.orderNumber,
      amount: req.amount,
      goodsName: req.orderName,
      returnUrl: `${window.location.origin}/api/payments/nicepay/return`,
      buyerName: req.buyerName,
      buyerEmail: req.buyerEmail,
      fnError: (result) => reject(new PaymentError(result.errorMsg || result.resultMsg || '결제가 취소되었어요.')),
    })
  })
}
