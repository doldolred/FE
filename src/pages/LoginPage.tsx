import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../api/auth'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/Status'
import { safeRedirect } from '../lib/errors'
import { useAuthStore, useIsLoggedIn } from '../stores/authStore'

export default function LoginPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const loggedIn = useIsLoggedIn()
  const setLogin = useAuthStore((s) => s.setLogin)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (res) => {
      setLogin(res)
      navigate(redirect, { replace: true })
    },
  })

  if (loggedIn && !loginMutation.isSuccess) return <Navigate to={redirect} replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    loginMutation.mutate({ email, password })
  }

  return (
    <AuthCard title="로그인">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="이메일" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {loginMutation.error && <ErrorMessage error={loginMutation.error} />}
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          로그인
        </Button>
        <p className="text-right text-sm">
          <Link to="/password/forgot" className="text-neutral-500 hover:underline">
            비밀번호를 잊으셨나요?
          </Link>
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        아직 회원이 아니신가요?{' '}
        <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-beet-800 hover:underline">
          회원가입
        </Link>
      </p>
    </AuthCard>
  )
}
