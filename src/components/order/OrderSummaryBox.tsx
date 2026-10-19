import type { ReactNode } from 'react'
import { formatPrice } from '../../lib/format'

export default function OrderSummaryBox({ totalPrice, children }: { totalPrice: number; children?: ReactNode }) {
  return (
    <aside className="h-fit rounded-2xl bg-neutral-50 p-6 lg:sticky lg:top-24">
      <h2 className="font-bold">결제 금액</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-500">상품 금액</dt>
          <dd>{formatPrice(totalPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">배송비</dt>
          <dd>무료</dd>
        </div>
      </dl>
      <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 font-bold">
        <span>총 결제 금액</span>
        <span className="text-lg text-beet-800">{formatPrice(totalPrice)}</span>
      </div>
      {children}
    </aside>
  )
}
