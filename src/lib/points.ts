import type { PointType } from '../api/types'

/** 적립금 내역 종류 이름 — 마이페이지 · 관리자 공용 */
export const POINT_TYPE_LABEL: Record<PointType, string> = {
  EARN: '구매확정 적립',
  USE: '주문에 사용',
  RESTORE: '취소 · 반품으로 돌려받음',
  EXPIRE: '유효기간 만료',
  ADMIN: '돌돌 지급 · 차감',
}

/** 365일 단위면 'n년', 아니면 'n일' */
export const validPeriodText = (days: number) => (days % 365 === 0 ? `${days / 365}년` : `${days}일`)
