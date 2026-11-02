import { PAY_METHODS, type PayMethod } from '../../lib/payment'

interface Props {
  value: PayMethod
  onChange: (value: PayMethod) => void
  disabled?: boolean
}

export default function PayMethodPicker({ value, onChange, disabled }: Props) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-4 font-black">결제 수단</legend>
      <div className="grid grid-cols-2 gap-3">
        {PAY_METHODS.map((m) => {
          const on = m.key === value
          return (
            <label key={m.key} className="dd-choice text-sm" data-on={on ? '' : undefined}>
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
