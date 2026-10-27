/**
 * 돌돌 라인업 — 메인(프로토타입 v4) · 상품 상세 · 출시 예정이 같이 쓴다.
 *
 *   판매중 상품   가격 · 옵션은 서버(/api/products). 여기는 그림 · 색 · 영문 이름 · 스티커 문구만 (상품 id 로 찾는다)
 *   출시 예정     서버에 아직 없는 제품 — 메인 라인업에서 아래로부터 올라오고, 누르면 /lineup/:slug 미리 보기
 *
 * 색은 v4-shared.js 그대로: bg = 상세 페이지 바탕, stage = 제품 그림 뒤 판, dark = 바탕이 어두워 글자를 희게.
 * 제품이 늘면: 서버에 등록한 뒤 SELLING 에 id 로 한 항목, 아직 안 팔면 UPCOMING 에 한 항목.
 * 효능 · 건강 주장 문구는 넣지 않는다 (식품).
 */

export interface ProductColors {
  bg: string
  stage: string
  dark: boolean
}

export interface SellingInfo extends ProductColors {
  en: string
  spec: string
  points: string[]
  /** 정사각 실제 사진 (장바구니 · 관리자가 사진을 안 올렸을 때) */
  photo: string
}

/** 라인업 맨 앞 · 출시 예정 화면의 "지금 파는 제품" 링크 */
export const MAIN_PRODUCT_ID = 1

export const SELLING: Record<number, SellingInfo> = {
  // 1 = V5 의 "돌돌 제주산 100% NFC 레드비트즙"
  1: {
    en: 'RED BEET',
    spec: '120ml × 30포 / 60포',
    points: ['비트 100%', '물 0% · 설탕 0%', '120ml 한 포'],
    photo: '/products/beet/pouch-front.webp',
    bg: '#16173d',
    stage: '#e6f05a',
    dark: true,
  },
}

export type ArtKind = 'bottle' | 'jar'

export interface UpcomingProduct extends ProductColors {
  slug: string
  name: string
  en: string
  spec: string
  art: ArtKind
  desc: string
  points: string[]
}

export const UPCOMING: UpcomingProduct[] = [
  {
    slug: 'extract',
    name: '돌돌 비트 농축액',
    en: 'BEET EXTRACT',
    spec: '500ml',
    art: 'bottle',
    desc: '비트를 진하게 졸여 담은 농축액. 물이나 탄산수에 타서, 요리에 한 스푼.',
    points: ['제주산 비트', '물에 타서 · 요리에', '500ml 유리병'],
    bg: '#f6c3d4',
    stage: '#fff7f0',
    dark: false,
  },
  {
    slug: 'powder',
    name: '돌돌 비트 파우더',
    en: 'BEET POWDER',
    spec: '150g',
    art: 'jar',
    desc: '비트를 말려 곱게 간 가루. 요거트 · 스무디 · 베이킹에 붉은 색을 한 스푼.',
    points: ['제주산 비트 100%', '스무디 · 베이킹', '150g 유리병'],
    bg: '#e6f05a',
    stage: '#f6c3d4',
    dark: false,
  },
]

export const upcomingBySlug = (slug: string | undefined) => UPCOMING.find((p) => p.slug === slug)

/** 상세 페이지 색 변수 (v4-product 의 --bg · --fg · --stage · --accent) */
export function pageColors(c: ProductColors) {
  return {
    '--bg': c.bg,
    '--fg': c.dark ? '#fff' : '#16173d',
    '--stage': c.stage,
    '--accent': c.dark ? '#e6f05a' : '#d42a68',
  }
}

/** 상품 사진 — 관리자가 올린 사진이 먼저, 없으면 라인업 정사각 사진 */
export function productImageSrc(productId: number, imageUrl: string | null): string | null {
  return imageUrl ?? SELLING[productId]?.photo ?? null
}
