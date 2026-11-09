import { useQuery } from '@tanstack/react-query'
import { fetchOAuthProviders } from '../../api/oauth'
import type { SocialProvider } from '../../api/types'
import { SOCIAL_LABEL, startSocialLogin } from '../../lib/oauth'

const STYLE: Record<SocialProvider, string> = {
  KAKAO: 'bg-[#FEE500] text-[#191919]',
  NAVER: 'bg-[#03C75A] text-white',
}

/** 카카오 · 네이버로 시작하기 — 서버에 키를 넣은 것만 보인다 (없으면 아무것도 안 그림) */
export default function SocialLoginButtons({ redirect }: { redirect: string }) {
  const { data } = useQuery({ queryKey: ['oauth-providers'], queryFn: fetchOAuthProviders, staleTime: 10 * 60_000 })
  if (!data?.length) return null

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        간편 로그인
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="grid gap-2">
        {data.map((p) => (
          <button
            key={p.provider}
            type="button"
            onClick={() => startSocialLogin(p.authorizeUrl, redirect)}
            className={`h-12 w-full rounded-xl text-sm font-bold ${STYLE[p.provider]}`}
          >
            {SOCIAL_LABEL[p.provider]}로 시작하기
          </button>
        ))}
      </div>
    </div>
  )
}
