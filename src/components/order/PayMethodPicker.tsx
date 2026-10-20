import { PAY_METHODS, type PayMethod } from '../../lib/payment'

interface Props {
  value: PayMethod
  onChange: (value: PayMethod) => void
  disabled?: boolean
}

export default function PayMethodPicker({ value, onChange, disabled }: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-4 font-bold">결제 수단</legend>
      <div className="grid grid-cols-2 gap-3">
        {PAY_METHODS.map((m) => {
          const on = m.key === value
          return (
            <label
              key={m.key}
              className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-beet-200 ${on ? 'border-beet-700 bg-beet-50 text-beet-800' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}
            >
              <input
                type="radio"
                name="payMethod"
                value={m.key}
                checked={on}
                onChange={() => onChange(m.key)}
                className="sr-only"
              />
              {m.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
