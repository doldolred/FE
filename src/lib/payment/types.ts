export interface PaymentRequest {
  orderNumber: string
  amount: number
  /** 결제창에 보이는 상품명 — 예: "돌돌 비트즙 30포 외 1건" */
  orderName: string
  buyerName?: string
  buyerEmail?: string
}

/** 결제창 닫음 · PG 오류 · 승인 실패. message 는 화면에 그대로 보여 줄 문장 */
export class PaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PaymentError'
  }
}
