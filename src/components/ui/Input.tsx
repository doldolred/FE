import { useId, type InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: Props) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="ui-label mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        className="ui-input w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-beet-600 focus:ring-2 focus:ring-beet-100 aria-invalid:border-red-500"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
