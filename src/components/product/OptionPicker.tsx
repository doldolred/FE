import type { ProductOption } from '../../api/types'
import { formatPrice } from '../../lib/format'

/** 옵션(10포 · 30포 · 60포) 고르기 — 정상가 줄긋기 · 할인율 · 품절 */
export default function OptionPicker({
  options,
  value,
  onChange,
}: {
  options: ProductOption[]
  value: number | null
  onChange: (optionId: number) => void
}) {
  return (
    <div role="radiogroup" aria-label="옵션" className="grid gap-2">
      {options.map((o) => {
        const selected = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.soldOut}
            onClick={() => onChange(o.id)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              selected ? 'border-beet-700 bg-beet-50 ring-1 ring-beet-700' : 'border-neutral-300 hover:border-neutral-500'
            }`}
          >
            <span className="font-semibold">
              {o.name}
              {o.soldOut && <span className="ml-2 text-xs font-normal text-neutral-500">일시품절</span>}
            </span>
            <span className="text-right">
              {o.discountRate > 0 && (
                <>
                  <span className="mr-2 text-sm font-bold text-beet-700">{o.discountRate}%</span>
                  <span className="mr-2 text-xs text-neutral-400 line-through">{formatPrice(o.listPrice)}</span>
                </>
              )}
              <span className="font-bold">{formatPrice(o.price)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** 배송비 안내 한 줄 */
export function ShippingNote({ threshold = 50000, className = '' }: { threshold?: number; className?: string }) {
  return (
    <span className={className}>
      3,000원 · {formatPrice(threshold)} 이상 무료배송
      <span className="block text-xs text-neutral-500">제주 +3,000원 · 도서산간 +5,000원 (CJ대한통운)</span>
    </span>
  )
}
