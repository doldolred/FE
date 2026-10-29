const STEPS = ['장바구니', '주문 · 결제', '주문 완료']

/** 장바구니 → 주문서 → 완료 단계 표시 */
export default function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs font-black" aria-label="주문 단계">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          <span
            className={`rounded-full border-2 border-[#16173d] px-3 py-1 ${i === current ? 'bg-[#16173d] text-white' : i < current ? 'bg-[#e6f05a]' : 'bg-white opacity-60'}`}
          >
            {i + 1}. {s}
          </span>
          {i < STEPS.length - 1 && <span aria-hidden="true">→</span>}
        </li>
      ))}
    </ol>
  )
}
