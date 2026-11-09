import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { oauthCallback, socialSignup } from '../api/oauth'
import type { SocialProvider, SocialSignupInfo } from '../api/types'
import AuthCard from '../components/AuthCard'
import { ConsentFields, useConsent } from '../components/auth/ConsentFields'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { buttonClass } from '../components/ui/buttonStyles'
import { getFieldErrors, safeRedirect } from '../lib/errors'
import { SOCIAL_LABEL, takeSocialLogin } from '../lib/oauth'
import { useAuthStore } from '../stores/authStore'

/** 인가 코드는 한 번만 쓸 수 있다 — 개발 모드(StrictMode)에서 effect 가 두 번 돌아도 한 번만 보낸다 */
const usedCodes = new Set<string>()

/**
 * /oauth/:provider/callback — 카카오 · 네이버에서 돌아오는 곳.
 * 이미 가입한 계정이면 바로 로그인, 처음이면 약관 동의(가입) 화면을 보여 준다
 */
export default function OAuthCallbackPage() {
  const provider = useParams().provider ?? ''
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setLogin = useAuthStore((s) => s.setLogin)
  const [redirect, setRedirect] = useState('/')
  const [signup, setSignup] = useState<SocialSignupInfo | null>(null)
  const [error, setError] = useState<unknown>(null)
  const started = useRef(false)

  const code = params.get('code')
  const state = params.get('state')
  const denied = params.get('error')

  useEffect(() => {
    if (started.current) return
    started.current = true
    // 소셜 화면에서 '취소'를 누르면 code 대신 error 가 온다
    if (denied || !code) return
    if (usedCodes.has(code)) return
    usedCodes.add(code)
    const saved = takeSocialLogin(state)
    if (!saved) {
      setError(new Error('로그인 요청이 올바르지 않아요. 처음부터 다시 시도해 주세요.'))
      return
    }
    const to = safeRedirect(saved.redirect)
    setRedirect(to)
    oauthCallback(provider, code, state)
      .then((res) => {
        if (res.status === 'LOGIN' && res.login) {
          setLogin(res.login)
          navigate(to, { replace: true })
        } else {
          setSignup(res.signup)
        }
      })
      .catch(setError)
  }, [code, state, denied, provider, navigate, setLogin])

  if (denied || (!code && !error)) {
    return (
      <AuthCard kicker="LOGIN" title="로그인을 취소했어요">
        <Link to="/login" className={buttonClass('primary', 'w-full')}>
          로그인으로
        </Link>
      </AuthCard>
    )
  }
  if (error) {
    return (
      <AuthCard kicker="LOGIN" title="로그인하지 못했어요">
        <ErrorMessage error={error} />
        <Link to="/login" className={buttonClass('primary', 'mt-6 w-full')}>
          다시 로그인하기
        </Link>
      </AuthCard>
    )
  }
  if (!signup) return <Loading />
  return <SocialSignupForm info={signup} redirect={redirect} />
}

/** 처음 온 카카오 · 네이버 계정 — 이메일 · 이름 확인 + 약관 동의 후 가입 */
function SocialSignupForm({ info, redirect }: { info: SocialSignupInfo; redirect: string }) {
  const navigate = useNavigate()
  const setLogin = useAuthStore((s) => s.setLogin)
  const consentState = useConsent()
  const [form, setForm] = useState({ email: info.email ?? '', name: info.name ?? '', phone: info.phone ?? '' })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const mutation = useMutation({
    mutationFn: () => socialSignup({ signupToken: info.signupToken, ...form, ...consentState.consent }),
    onSuccess: (res) => {
      setLogin(res)
      navigate(redirect, { replace: true })
    },
  })
  const fieldErrors = getFieldErrors(mutation.error)
  const label = SOCIAL_LABEL[info.provider as SocialProvider]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (consentState.requiredOk) mutation.mutate()
  }

  return (
    <AuthCard kicker="JOIN" title={`${label}로 가입하기`} sub="처음 오셨네요. 아래 내용을 확인하고 동의하면 가입이 끝나요.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={info.email ? '이메일' : '이메일 (주문 · 배송 안내를 받을 주소)'}
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
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
        {mutation.error && <ErrorMessage error={mutation.error} />}
        <Button type="submit" className="w-full" disabled={mutation.isPending || !consentState.requiredOk}>
          가입하기
        </Button>
      </form>
    </AuthCard>
  )
}
