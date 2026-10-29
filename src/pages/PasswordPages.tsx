import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { requestPasswordReset, resetPassword } from '../api/auth'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { buttonClass } from '../components/ui/buttonStyles'
import { ErrorMessage } from '../components/ui/Status'
import { getFieldErrors } from '../lib/errors'

/** /password/forgot — 이메일로 재설정 링크 받기. 가입 여부와 상관없이 같은 안내를 보여 준다 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const mutation = useMutation({ mutationFn: () => requestPasswordReset(email) })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <AuthCard kicker="PASSWORD" title="메일을 확인해 주세요">
        <p className="text-center text-sm leading-relaxed text-neutral-600">
          가입된 이메일이라면 <b>{email}</b> 으로
          <br />
          비밀번호 재설정 링크를 보냈어요. 링크는 30분 동안 쓸 수 있어요.
        </p>
        <p className="mt-4 text-center text-xs text-neutral-400">메일이 안 보이면 스팸함도 확인해 주세요.</p>
        <Link to="/login" className={buttonClass('secondary', 'mt-8 w-full')}>
          로그인으로
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard kicker="PASSWORD" title="비밀번호 찾기">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-neutral-600">가입한 이메일을 적으면 비밀번호를 새로 정할 수 있는 링크를 보내 드려요.</p>
        <Input label="이메일" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          재설정 링크 받기
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link to="/login" className="hover:underline">
          ← 로그인으로
        </Link>
      </p>
    </AuthCard>
  )
}

/** /password/reset?token=... — 메일 링크로 와서 새 비밀번호 정하기 */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = confirm !== '' && password !== confirm
  const mutation = useMutation({ mutationFn: () => resetPassword(token, password) })
  const fieldErrors = getFieldErrors(mutation.error)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!mismatch) mutation.mutate()
  }

  if (!token) {
    return (
      <AuthCard kicker="PASSWORD" title="링크가 올바르지 않아요">
        <Link to="/password/forgot" className={buttonClass('primary', 'w-full')}>
          비밀번호 찾기 다시 하기
        </Link>
      </AuthCard>
    )
  }

  if (mutation.isSuccess) {
    return (
      <AuthCard kicker="PASSWORD" title="비밀번호를 바꿨어요">
        <p className="text-center text-sm text-neutral-600">새 비밀번호로 로그인해 주세요. 다른 기기에서는 로그아웃됐어요.</p>
        <Link to="/login" className={buttonClass('primary', 'mt-8 w-full')}>
          로그인
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard kicker="PASSWORD" title="새 비밀번호 정하기">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상"
          required
          minLength={8}
          maxLength={64}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.newPassword}
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? '비밀번호가 일치하지 않아요.' : undefined}
        />
        {mutation.error && <ErrorMessage error={mutation.error} />}
        {mutation.error && (
          <Link to="/password/forgot" className="block text-center text-sm text-beet-800 underline">
            링크 다시 받기
          </Link>
        )}
        <Button type="submit" className="w-full" disabled={mutation.isPending || mismatch}>
          비밀번호 바꾸기
        </Button>
      </form>
    </AuthCard>
  )
}
