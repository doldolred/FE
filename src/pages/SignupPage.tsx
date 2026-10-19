import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { login, signup } from '../api/auth'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/Status'
import { getFieldErrors, safeRedirect } from '../lib/errors'
import { useAuthStore, useIsLoggedIn } from '../stores/authStore'

export default function SignupPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const loggedIn = useIsLoggedIn()
  const setLogin = useAuthStore((s) => s.setLogin)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const passwordMismatch = form.passwordConfirm !== '' && form.password !== form.passwordConfirm

  // 가입 성공하면 바로 로그인까지
  const signupMutation = useMutation({
    mutationFn: async () => {
      const { email, password, name, phone } = form
      await signup({ email, password, name, phone: phone || undefined })
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
    if (passwordMismatch) return
    signupMutation.mutate()
  }

  return (
    <AuthCard title="회원가입">
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
        {signupMutation.error && <ErrorMessage error={signupMutation.error} />}
        <Button type="submit" className="w-full" disabled={signupMutation.isPending || passwordMismatch}>
          가입하기
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        이미 회원이신가요?{' '}
        <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-beet-800 hover:underline">
          로그인
        </Link>
      </p>
    </AuthCard>
  )
}
