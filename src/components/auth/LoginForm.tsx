import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { useAuthStore, useIsLoggedIn } from '../../stores/authStore'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { ErrorMessage } from '../ui/Status'
import SocialLoginButtons from './SocialLoginButtons'

/** 로그인 폼 — 카드 · 머리말 · 전환 토글은 pages/AuthPage 가 그린다 */
export default function LoginForm({ redirect }: { redirect: string }) {
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
    <>
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
        <p className="flex justify-end gap-3 text-sm text-neutral-500">
          <Link to="/email/find" className="hover:underline">
            이메일 찾기
          </Link>
          <span aria-hidden>·</span>
          <Link to="/password/forgot" className="hover:underline">
            비밀번호 찾기
          </Link>
        </p>
      </form>
      <SocialLoginButtons redirect={redirect} />
    </>
  )
}
