import type { ReactNode } from 'react'
import { formatPrice } from '../../lib/format'

interface Props {
  itemsPrice: number
  shippingFee: number
  /** 할인코드로 깎은 금액 */
  discountAmount?: number
  couponCode?: string | null
  /** 제주 · 도서 추가 배송비가 붙었으면 그 지역 이름 */
  areaName?: string | null
  /** 이 금액 이상이면 기본 배송비 무료 — 얼마 더 담으면 되는지 막대로 보여 준다 */
  freeThreshold?: number
  children?: ReactNode
}

/** 결제 금액 카드 (장바구니 · 주문서) — 넓은 화면에서는 오른쪽에 붙어 따라온다 */
export default function OrderSummaryBox({ itemsPrice, shippingFee, discountAmount = 0, couponCode, areaName, freeThreshold, children }: Props) {
  const remaining = freeThreshold ? freeThreshold - itemsPrice : 0
  const progress = freeThreshold ? Math.min(100, Math.round((itemsPrice / freeThreshold) * 100)) : 100
  return (
    <aside className="dd-box h-fit lg:sticky lg:top-28">
      <h2>결제 금액</h2>
      {freeThreshold ? (
        <div className="mb-5 rounded-2xl border-2 border-[#222021] bg-[#f7f3ee] p-3 text-xs font-bold">
          <p>{remaining > 0 ? `${formatPrice(remaining)} 더 담으면 기본 배송비 무료` : '기본 배송비 무료예요'}</p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full border-2 border-[#222021] bg-white" aria-hidden="true">
            <div className="h-full bg-[#da1f2e] transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
      <dl className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">상품 금액</dt>
          <dd className="font-bold">{formatPrice(itemsPrice)}</dd>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between font-bold text-[#da1f2e]">
            <dt>할인{couponCode ? ` (${couponCode})` : ''}</dt>
            <dd>−{formatPrice(discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-neutral-500">배송비{areaName ? ` (${areaName} 추가 포함)` : ''}</dt>
          <dd className="font-bold">{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-end justify-between border-t-2 border-dashed border-[#222021]/30 pt-4">
        <span className="font-black">총 결제 금액</span>
        <span className="dd-price-big">{formatPrice(itemsPrice - discountAmount + shippingFee)}</span>
      </div>
      {children}
    </aside>
  )
}
