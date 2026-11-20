import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login, signup } from '../../api/auth'
import { getFieldErrors } from '../../lib/errors'
import { useAuthStore, useIsLoggedIn } from '../../stores/authStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { ErrorMessage } from '../ui/Status'
import { ConsentFields, useConsent } from './ConsentFields'
import SocialLoginButtons from './SocialLoginButtons'

/** 회원가입 폼 — 카드 · 머리말 · 전환 토글은 pages/AuthPage 가 그린다 */
export default function SignupForm({ redirect }: { redirect: string }) {
  const loggedIn = useIsLoggedIn()
  const setLogin = useAuthStore((s) => s.setLogin)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' })
  const consentState = useConsent()
  const { consent, requiredOk } = consentState
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const passwordMismatch = form.passwordConfirm !== '' && form.password !== form.passwordConfirm

  // 가입 성공하면 바로 로그인까지
  const signupMutation = useMutation({
    mutationFn: async () => {
      const { email, password, name, phone } = form
      await signup({ email, password, name, phone: phone || undefined, ...consent })
      return login({ email, password })
    },
    onSuccess: (res) => {
      setLogin(res)
      navigate(redirect, { replace: true })
    },
  })
  const fieldErrors = getFieldErrors(signupMutation.error)

  if (loggedIn && !signupMutation.isSuccess) return <Navigate to={redirect} replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (passwordMismatch || !requiredOk) return
    signupMutation.mutate()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="이메일" type="email" autoComplete="email" required value={form.email} onChange={set('email')} error={fieldErrors.email} />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상"
          required
          minLength={8}
          maxLength={64}
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          required
          value={form.passwordConfirm}
          onChange={set('passwordConfirm')}
          error={passwordMismatch ? '비밀번호가 일치하지 않아요.' : undefined}
        />
        <Input label="이름" autoComplete="name" required maxLength={50} value={form.name} onChange={set('name')} error={fieldErrors.name} />
        <Input
          label="휴대폰 번호 (선택)"
          type="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={form.phone}
          onChange={set('phone')}
          error={fieldErrors.phone}
        />

        <ConsentFields state={consentState} fieldErrors={fieldErrors} />

        {signupMutation.error && <ErrorMessage error={signupMutation.error} />}
        <Button type="submit" className="w-full" disabled={signupMutation.isPending || passwordMismatch || !requiredOk}>
          가입하기
        </Button>
      </form>
      <SocialLoginButtons redirect={redirect} />
    </>
  )
}
