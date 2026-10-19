export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-beet-700 text-white hover:bg-beet-800',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
}

/** <Link> 를 버튼처럼 보이게 할 때도 사용 */
export const buttonClass = (variant: ButtonVariant = 'primary', className = '') =>
  `${base} ${variants[variant]} ${className}`
