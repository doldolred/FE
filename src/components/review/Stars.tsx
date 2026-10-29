/** 별점 보기 (0.1 단위까지 채움). 화면 읽기에는 "5점 만점에 4.7점" */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(5, value)) * 20
  return (
    <span className="dd-stars" role="img" aria-label={`5점 만점에 ${Math.round(value * 10) / 10}점`} style={{ fontSize: size }}>
      <span aria-hidden="true">★★★★★</span>
      <span aria-hidden="true" className="fill" style={{ width: `${pct}%` }}>
        ★★★★★
      </span>
    </span>
  )
}

/** 별점 고르기 (1 ~ 5) */
export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="별점">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          className={`text-4xl leading-none transition-transform hover:scale-110 ${n <= value ? 'text-[#da1f2e]' : 'text-neutral-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
