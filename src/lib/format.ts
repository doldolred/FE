import type { InquiryCategory, InquiryStatus, OrderStatus } from '../api/types'

export const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

const dayFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' })

/** 날짜만 (예: 2026. 10. 27.) */
export const formatDay = (iso: string) => dayFormat.format(new Date(iso))

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  PREPARING: '상품 준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
}

export const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID']

export const INQUIRY_CATEGORY_LABEL: Record<InquiryCategory, string> = {
  ORDER: '주문 · 결제',
  SHIPPING: '배송',
  PRODUCT: '상품',
  CANCEL: '취소 · 반품 · 교환',
  MEMBER: '회원 정보',
  ETC: '기타',
}

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  WAITING: '답변 대기',
  ANSWERED: '답변 완료',
}
