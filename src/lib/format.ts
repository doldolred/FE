import type { ClaimReason, ClaimStatus, ClaimType, InquiryCategory, InquiryStatus, OrderStatus } from '../api/types'

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
  RETURNED: '반품 완료',
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

export const CLAIM_TYPE_LABEL: Record<ClaimType, string> = {
  CANCEL: '취소 요청',
  RETURN: '반품',
  EXCHANGE: '교환',
}

export const CLAIM_REASON_LABEL: Record<ClaimReason, string> = {
  CHANGE_OF_MIND: '단순 변심',
  DEFECTIVE: '상품 불량 · 파손',
  WRONG_ITEM: '다른 상품이 옴',
  DELAYED: '배송 지연',
  OTHER: '기타',
}

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  REQUESTED: '접수',
  APPROVED: '처리 중',
  COMPLETED: '완료',
  REJECTED: '거절',
  WITHDRAWN: '철회',
}
