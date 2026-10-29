interface Props {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export default function QuantityStepper({ value, onChange, min = 1, max = 99, disabled }: Props) {
  const btn = 'h-9 w-9 text-lg text-neutral-600 hover:bg-neutral-100 disabled:opacity-40'
  return (
    <div className="ui-qty inline-flex items-center rounded-lg border border-neutral-300">
      <button
        type="button"
        className={btn}
        aria-label="수량 줄이기"
        disabled={disabled || value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        aria-label="수량 늘리기"
        disabled={disabled || value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
