import type { FrameSequence } from '../components/product/Turntable'

/**
 * 상품 쇼케이스 — 360° 사진 묶음 · 강조색 · 돌리면 켜지는 특징. 상품 id 로 찾는다.
 * 상품이 늘면(농축액 · 파우더 …) 여기에 한 항목씩 더한다. 없는 상품은 보통 사진으로 보인다.
 *
 * 360° 사진 뽑는 법 (한 바퀴 8초 영상 → 72장, docs/film-prompt.md 의 턴테이블 프롬프트):
 *   ffmpeg -i turntable.mp4 -t 8 -vf "fps=9,scale=1000:-2" -c:v libwebp -quality 70 FE/public/showcase/beet/t%03d.webp
 * 배경이 사이트 바탕색(#140a0e)과 같아야 경계가 안 보인다. TODO(고객확인) 촬영본
 */
export interface ShowcaseFeature {
  /** 이 특징이 켜지는 회전 위치 (0 = 정면, 0.5 = 뒷면) */
  at: number
  title: string
  body: string
}

export interface Showcase {
  /** 짧은 영문 이름 — 뒤에 크게 깔리는 글자 */
  wordmark: string
  tagline: string
  accent: string
  turntable: FrameSequence | null
  poster: string | null
  features: ShowcaseFeature[]
}

export const SHOWCASE: Record<number, Showcase> = {
  // 1 = V1__init.sql 의 "돌돌 비트즙 30포"
  1: {
    wordmark: 'RED BEET',
    tagline: '비트만 그대로 짜낸 100ml 한 포',
    accent: '#f0729f',
    turntable: null,
    poster: '/film/poster.webp',
    features: [
      { at: 0.0, title: '비트 100%', body: '물 · 설탕 · 향료 없이 비트만 담았어요.' },
      { at: 0.25, title: '100ml 한 포', body: '한 번 마실 만큼. 뜯어서 바로 마셔요.' },
      { at: 0.5, title: '국내산 비트', body: '제철에 거둔 비트를 산지에서 받아 씁니다.' },
      { at: 0.75, title: '30포 한 상자', body: '한 달치. 냉장 보관하면 더 신선해요.' },
    ],
  },
}

/** 회전 위치(0 → 1)에 가장 가까운 특징의 번호 */
export function activeFeature(features: ShowcaseFeature[], progress: number): number {
  let best = 0
  let bestDist = 1
  features.forEach((f, i) => {
    const d = Math.abs(((progress - f.at + 1.5) % 1) - 0.5) // 원형 거리
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}
