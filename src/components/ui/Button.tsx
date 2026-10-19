import type { ButtonHTMLAttributes } from 'react'
import { buttonClass, type ButtonVariant } from './buttonStyles'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />
}
