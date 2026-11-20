import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import PageHead from '../components/store/PageHead'
import { safeRedirect } from '../lib/errors'

type Mode = 'login' | 'signup'

const COPY: Record<Mode, { kicker: string; title: string; sub: string; ask: string; go: string }> = {
  login: {
    kicker: 'LOGIN',
    title: '다시 만나 반가워요',
    sub: '이메일과 비밀번호로 로그인해 주세요.',
    ask: '처음 오셨나요?',
    go: '회원가입 →',
  },
  signup: {
    kicker: 'JOIN',
    title: '돌돌 회원가입',
    sub: '가입하면 주문 내역 · 후기 · 1:1 문의를 한곳에서 볼 수 있어요.',
    ask: '이미 회원이신가요?',
    go: '로그인 →',
  },
}

/** 즙이 카드를 다 덮을 때까지 기다리는 시간 — store.css 의 채움 전환(0.46s)보다 조금 길게 */
const FILL_MS = 520
const HEIGHT_MS = 560
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 로그인 · 회원가입을 한 화면에서 토글로 오간다 (/login · /signup 주소는 그대로).
 * 바꿀 때 카드에 비트즙이 차오르고 → 다 덮였을 때 폼을 바꾸고 → 즙이 빠지며 새 폼이 드러난다.
 * 주소가 먼저 바뀌고(mode) 화면은 즙이 찬 뒤에 따라온다(shown). 헤더 링크 · 뒤로 가기로 바뀌어도 똑같이 움직인다.
 */
export default function AuthPage() {
  const { pathname, search } = useLocation()
  const [params] = useSearchParams()
  const redirect = safeRedirect(params.get('redirect'))
  const mode: Mode = pathname.startsWith('/signup') ? 'signup' : 'login'
  const [shown, setShown] = useState<Mode>(mode)
  const pouring = mode !== shown

  const boxRef = useRef<HTMLDivElement>(null)
  const juiceRef = useRef<HTMLDivElement>(null)
  const fromHeight = useRef(0)

  useEffect(() => {
    if (mode === shown) return
    const timer = window.setTimeout(
      () => {
        fromHeight.current = boxRef.current?.offsetHeight ?? 0
        setShown(mode)
      },
      reducedMotion() ? 0 : FILL_MS,
    )
    return () => window.clearTimeout(timer)
  }, [mode, shown])

  // 두 폼의 길이가 달라서, 바뀐 직후 카드 높이를 이전 → 새 높이로 부드럽게 잇는다
  useLayoutEffect(() => {
    const box = boxRef.current
    const from = fromHeight.current
    fromHeight.current = 0
    if (!box || !from || reducedMotion()) return
    const to = box.offsetHeight
    if (from === to) return
    box.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: HEIGHT_MS, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' })
  }, [shown])

  // 물결 · 방울은 즙이 움직이는 동안만 돌린다
  const setMoving = (on: boolean) => juiceRef.current?.toggleAttribute('data-moving', on)

  const copy = COPY[shown]
  const other: Mode = shown === 'login' ? 'signup' : 'login'

  return (
    <div className="dd-auth">
      <div key={shown} className="dd-auth-head">
        <PageHead kicker={copy.kicker} title={copy.title} sub={copy.sub} center />
      </div>

      <nav className="dd-auth-switch" aria-label="로그인 · 회원가입 전환">
        <NavLink to={{ pathname: '/login', search }} replace>
          로그인
        </NavLink>
        <NavLink to={{ pathname: '/signup', search }} replace>
          회원가입
        </NavLink>
      </nav>

      <div ref={boxRef} className="dd-box dd-auth-stage" data-pouring={pouring ? '' : undefined} aria-busy={pouring}>
        <div className="dd-auth-pane">{shown === 'login' ? <LoginForm redirect={redirect} /> : <SignupForm redirect={redirect} />}</div>

        <div ref={juiceRef} className="dd-juice" aria-hidden>
          <div
            className="dd-juice-liquid"
            onTransitionRun={() => setMoving(true)}
            onTransitionEnd={() => setMoving(false)}
            onTransitionCancel={() => setMoving(false)}
          >
            <svg className="dd-juice-wave" data-back="" viewBox="0 0 1200 40" preserveAspectRatio="none">
              <path d="M-75 14 Q0 -4 75 14 T225 14 T375 14 T525 14 T675 14 T825 14 T975 14 T1125 14 T1275 14 V40 H-75 Z" />
            </svg>
            <svg className="dd-juice-wave" viewBox="0 0 1200 40" preserveAspectRatio="none">
              <path d="M0 22 Q75 4 150 22 T300 22 T450 22 T600 22 T750 22 T900 22 T1050 22 T1200 22 V40 H0 Z" />
            </svg>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="dd-juice-bubble" />
            ))}
          </div>
        </div>
      </div>

      <div className="dd-auth-foot">
        <span>{copy.ask}</span>
        <Link
          to={{ pathname: `/${other}`, search }}
          replace
          onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })}
        >
          {copy.go}
        </Link>
      </div>
    </div>
  )
}
