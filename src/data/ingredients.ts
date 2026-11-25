/**
 * 메인의 성분 구간 (1차 수정 요청: 누끼 이미지 + 성분명 + 짧은 설명이 하나씩 등장).
 * 지금 문구 · 그림은 임시다 — 고객사의 성분 목록 · 누끼 이미지 · 문구를 받으면 바꾼다.
 * 일반식품이라 효능(무엇에 좋다)은 쓰지 않고 "무엇인지"만 소개한다. 효능 문구는 고객사가 심의 여부를 확인한 것만 넣는다.
 */
export interface Ingredient {
  ko: string
  en: string
  text: string
  img: string
}

export const INGREDIENTS: Ingredient[] = [
  { ko: '식이 질산염', en: 'NITRATE', text: '비트 같은 뿌리채소와 잎채소에 들어 있는 성분이에요.', img: '/art/beet-whole.webp' },
  { ko: '베타인', en: 'BETAINE', text: '비트(Beta vulgaris)에서 처음 발견되어 이름이 붙은 성분이에요.', img: '/art/beet-half.webp' },
  { ko: '베타레인', en: 'BETALAIN', text: '비트의 짙은 붉은빛을 내는 천연 색소예요.', img: '/art/beet-half.webp' },
  { ko: '칼륨', en: 'POTASSIUM', text: '채소와 과일에 많이 들어 있는 무기질이에요.', img: '/art/beet-whole.webp' },
]
