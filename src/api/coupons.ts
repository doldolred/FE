import { api, qs } from './client'
import type { CouponCheck } from './types'

/** 주문서 할인코드 미리보기 (로그인 필요) — 지금 장바구니 기준. 실제 적용은 주문할 때 서버가 다시 계산 */
export const checkCoupon = (code: string) => api.get<CouponCheck>(`/api/coupons/check${qs({ code })}`)
