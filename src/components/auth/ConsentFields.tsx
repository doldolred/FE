import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type Consent = 'agreeTerms' | 'agreePrivacy' | 'agreeAge' | 'agreeMarketing'
const REQUIRED: Consent[] = ['agreeTerms', 'agreePrivacy', 'agreeAge']

/** 가입 동의 상태 — 이메일 가입 · 카카오 · 네이버 가입이 같이 쓴다 */
export function useConsent() {
  const [consent, setConsent] = useState<Record<Consent, boolean>>({
    agreeTerms: false,
    agreePrivacy: false,
    agreeAge: false,
    agreeMarketing: false,
  })
  const toggle = (key: Consent) => setConsent((c) => ({ ...c, [key]: !c[key] }))
  const allChecked = Object.values(consent).every(Boolean)
  const toggleAll = () => {
    const next = !allChecked
    setConsent({ agreeTerms: next, agreePrivacy: next, agreeAge: next, agreeMarketing: next })
  }
  const requiredOk = REQUIRED.every((k) => consent[k])
  return { consent, toggle, allChecked, toggleAll, requiredOk }
}

/** 전체 동의 + 필수 3개 + 마케팅(선택) */
export function ConsentFields({ state, fieldErrors }: { state: ReturnType<typeof useConsent>; fieldErrors: Record<string, string> }) {
  const { consent, toggle, allChecked, toggleAll } = state
  return (
    <fieldset className="rounded-2xl border border-[#222021]/15 bg-[#f4f4f4] p-4">
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
