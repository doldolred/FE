import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { login, signup } from '../api/auth'
import AuthCard from '../components/AuthCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { ErrorMessage } from '../components/ui/Status'
import { getFieldErrors, safeRedirect } from '../lib/errors'
import { useAuthStore, useIsLoggedIn } from '../stores/authStore'

type Consent = 'agreeTerms' | 'agreePrivacy' | 'agreeAge' | 'agreeMarketing'
const REQUIRED: Consent[] = ['agreeTerms', 'agreePrivacy', 'agreeAge']

export default function SignupPage() {
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const loggedIn = useIsLoggedIn()
  const setLogin = useAuthStore((s) => s.setLogin)
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', name: '', phone: '' })
  const [consent, setConsent] = useState<Record<Consent, boolean>>({
    agreeTerms: false,
    agreePrivacy: false,
    agreeAge: false,
    agreeMarketing: false,
  })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggle = (key: Consent) => setConsent((c) => ({ ...c, [key]: !c[key] }))
  const allChecked = Object.values(consent).every(Boolean)
  const toggleAll = () => {
    const next = !allChecked
    setConsent({ agreeTerms: next, agreePrivacy: next, agreeAge: next, agreeMarketing: next })
  }
  const passwordMismatch = form.passwordConfirm !== '' && form.password !== form.passwordConfirm
  const requiredOk = REQUIRED.every((k) => consent[k])

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
    <AuthCard
      title="돌돌 회원가입"
      kicker="JOIN"
      sub="가입하면 주문 내역 · 후기 · 1:1 문의를 한곳에서 볼 수 있어요."
      foot={
        <>
          <span>이미 회원이신가요?</span>
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`}>로그인 →</Link>
        </>
      }
    >
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

        <fieldset className="rounded-2xl border-2 border-[#16173d] bg-[#fff7f0] p-4">
          <legend className="sr-only">약관 동의</legend>
          <Check checked={allChecked} onChange={toggleAll} strong>
            전체 동의
          </Check>
          <div className="my-3 border-t border-neutral-200" />
          <div className="space-y-2.5">
            <Check checked={consent.agreeTerms} onChange={() => toggle('agreeTerms')} error={fieldErrors.agreeTerms}>
              [필수] 이용약관 동의 <DocLink to="/terms" />
            </Check>
            <Check checked={consent.agreePrivacy} onChange={() => toggle('agreePrivacy')} error={fieldErrors.agreePrivacy}>
              [필수] 개인정보 수집 · 이용 동의 <DocLink to="/privacy" />
            </Check>
            <Check checked={consent.agreeAge} onChange={() => toggle('agreeAge')} error={fieldErrors.agreeAge}>
              [필수] 만 14세 이상입니다
            </Check>
            <Check checked={consent.agreeMarketing} onChange={() => toggle('agreeMarketing')}>
              [선택] 신상품 · 이벤트 소식 받기
            </Check>
          </div>
        </fieldset>

        {signupMutation.error && <ErrorMessage error={signupMutation.error} />}
        <Button type="submit" className="w-full" disabled={signupMutation.isPending || passwordMismatch || !requiredOk}>
          가입하기
        </Button>
      </form>
    </AuthCard>
  )
}

function Check({ checked, onChange, strong, error, children }: { checked: boolean; onChange: () => void; strong?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className={`flex cursor-pointer items-center gap-2.5 text-sm ${strong ? 'font-bold' : 'text-neutral-700'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-beet-700" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1 pl-6 text-xs text-red-600">{error}</p>}
    </div>
  )
}

/** 체크박스 줄 안의 "보기" — 새 탭으로 열어 쓰던 내용이 사라지지 않게 */
function DocLink({ to }: { to: string }) {
  return (
    <Link to={to} target="_blank" className="ml-1 text-xs text-neutral-400 underline hover:text-neutral-600">
      보기
    </Link>
  )
}
