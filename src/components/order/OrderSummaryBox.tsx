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
  /** 이 금액 이상이면 기본 배송비 무료 — 얼마 더 담으면 되는지 보여 준다 */
  freeThreshold?: number
  children?: ReactNode
}

export default function OrderSummaryBox({ itemsPrice, shippingFee, discountAmount = 0, couponCode, areaName, freeThreshold, children }: Props) {
  const remaining = freeThreshold ? freeThreshold - itemsPrice : 0
  return (
    <aside className="h-fit rounded-2xl bg-neutral-50 p-6 lg:sticky lg:top-24">
      <h2 className="font-bold">결제 금액</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">상품 금액</dt>
          <dd>{formatPrice(itemsPrice)}</dd>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-beet-700">
            <dt>할인{couponCode ? ` (${couponCode})` : ''}</dt>
            <dd>−{formatPrice(discountAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-neutral-500">배송비{areaName ? ` (${areaName} 추가 포함)` : ''}</dt>
          <dd>{shippingFee === 0 ? '무료' : formatPrice(shippingFee)}</dd>
        </div>
      </dl>
      {remaining > 0 && (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-beet-800">{formatPrice(remaining)} 더 담으면 기본 배송비 무료</p>
      )}
      <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 font-bold">
        <span>총 결제 금액</span>
        <span className="text-lg text-beet-800">{formatPrice(itemsPrice - discountAmount + shippingFee)}</span>
      </div>
      {children}
    </aside>
  )
}
