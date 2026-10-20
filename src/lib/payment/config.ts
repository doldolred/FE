/**
 * 결제 설정 — 브라우저에 공개돼도 되는 값만 (.env.example 참고). 비밀 키는 BE 에만 있다.
 *
 * VITE_PAYMENT_PROVIDER
 *   nicepay  나이스페이 START 직접 연동 (지금)
 *   portone  포트원 V2 경유 → 나이스페이먼츠 (정산 때 갈아탈 때). BE 의 PAYMENT_PROVIDER 와 같은 값이어야 한다
 */
export type PaymentProvider = 'nicepay' | 'portone'

const env = import.meta.env

export const PAYMENT_PROVIDER: PaymentProvider = env.VITE_PAYMENT_PROVIDER === 'portone' ? 'portone' : 'nicepay'

export const NICEPAY = {
  clientId: (env.VITE_NICEPAY_CLIENT_ID as string | undefined) ?? '',
  sdkUrl: 'https://pay.nicepay.co.kr/v1/js/',
}

export const PORTONE = {
  storeId: (env.VITE_PORTONE_STORE_ID as string | undefined) ?? '',
  channelKey: (env.VITE_PORTONE_CHANNEL_KEY as string | undefined) ?? '',
}

/** 키가 들어와 있어야 결제창을 띄운다. 없으면 주문은 "결제 대기"로만 접수된다 */
export const PAYMENT_ENABLED =
  PAYMENT_PROVIDER === 'nicepay' ? NICEPAY.clientId !== '' : PORTONE.storeId !== '' && PORTONE.channelKey !== ''

/** 결제 수단 — 화면에서는 이 키로 고르고, PG 별 코드로 바꿔서 보낸다 */
export type PayMethod = 'card' | 'bank'

export const PAY_METHODS: { key: PayMethod; label: string; nicepay: string; portone: 'CARD' | 'TRANSFER' }[] = [
  { key: 'card', label: '신용 · 체크카드', nicepay: 'card', portone: 'CARD' },
  { key: 'bank', label: '계좌이체', nicepay: 'bank', portone: 'TRANSFER' },
]
