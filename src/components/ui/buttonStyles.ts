export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'lime'

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-beet-700 text-white hover:bg-beet-800',
  secondary: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100',
  lime: 'bg-lime text-ink hover:brightness-95',
}

/** <Link> 를 버튼처럼 보이게 할 때도 사용. ui-btn-* 는 손님 화면(styles/store.css)에서 v4 모양으로 바뀐다 */
export const buttonClass = (variant: ButtonVariant = 'primary', className = '') =>
  `ui-btn ui-btn-${variant} ${base} ${variants[variant]} ${className}`
