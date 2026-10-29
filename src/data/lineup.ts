import type { LineupArt, LineupTheme, Product } from '../api/types'
import { formatPrice } from '../lib/format'

/**
 * 돌돌 라인업 — 메인(프로토타입 v4) · 상품 상세 · 출시 예정이 같이 쓴다.
 *
 * 무엇을 어떤 순서로 보여 줄지(판매중 · 출시 예정 · 비공개, 영문 이름, 스티커 문구, 색, 그림, 파우치 도안)는
 * 관리자 상품 화면에서 정하고 서버(/api/products)가 준다. 여기는 색 묶음 · 그림 종류만.
 *
 * 색은 제품 패키지 색(빨강 · 먹색 · 흰색)에 맞춘 묶음: bg = 상세 페이지 바탕, stage = 제품 그림 뒤 판, dark = 바탕이 어두워 글자를 희게.
 * 효능 · 건강 주장 문구는 넣지 않는다 (식품).
 */

export interface ProductColors {
  bg: string
  stage: string
  dark: boolean
}

export const THEMES: Record<LineupTheme, ProductColors & { label: string }> = {
  // 키 이름은 DB 값이라 그대로 두고, 색은 패키지(빨강 #da1f2e · 먹색 #222021 · 흰색)에 맞춘 묶음
  NAVY: { label: '먹색 · 블러시', bg: '#222021', stage: '#f6d4cf', dark: true },
  PINK: { label: '블러시 · 화이트', bg: '#f6d4cf', stage: '#ffffff', dark: false },
  LIME: { label: '종이 · 블러시', bg: '#f3eee8', stage: '#f6d4cf', dark: false },
}

export const themeColors = (theme: LineupTheme | null | undefined): ProductColors => THEMES[theme ?? 'NAVY'] ?? THEMES.NAVY

export const ART_LABELS: Record<LineupArt, string> = {
  POUCH: '3D 파우치',
  BOTTLE: '병',
  JAR: '유리병',
}

/** 그림 종류 — CSS 의 data-art 값 (pouch · bottle · jar) */
export type ArtKind = 'pouch' | 'bottle' | 'jar'
export const artKind = (art: LineupArt | null | undefined): ArtKind => (art ? (art.toLowerCase() as ArtKind) : 'pouch')

/** 라인업 가운데 메인 = 맨 앞 판매중 상품 (관리자 라인업 순서) */
export const mainProductOf = (products: Product[] | undefined) => products?.find((p) => p.status === 'SELLING')

/** 상품명에서 "돌돌 " 을 뺀 짧은 이름 (라인업 이름표) */
export const shortName = (name: string) => name.replace(/^돌돌\s+/, '')

/** 카드 · 이름표의 상태 한 줄 — "38,000원~ · 120ml × 30포" / "출시 예정 · 500ml" */
export function statusLine(p: Product) {
  const head = p.status === 'COMING_SOON' ? '출시 예정' : p.soldOut ? '품절' : `${formatPrice(p.minPrice)}~`
  return p.spec ? `${head} · ${p.spec}` : head
}

/** 상세 페이지 색 변수 (v4-product 의 --bg · --fg · --stage · --accent) */
export function pageColors(c: ProductColors) {
  return {
    '--bg': c.bg,
    '--fg': c.dark ? '#fff' : '#222021',
    '--stage': c.stage,
    '--accent': c.dark ? '#f6d4cf' : '#da1f2e',
    '--accent-fg': c.dark ? '#222021' : '#fff',
  }
}

/** 관리자가 사진을 안 올렸을 때 쓰는 정사각 사진 (상품 id) */
const FALLBACK_PHOTO: Record<number, string> = {
  1: '/products/beet/pouch-front.webp',
}

/** 상품 사진 — 관리자가 올린 사진이 먼저, 없으면 준비된 정사각 사진 */
export function productImageSrc(productId: number, imageUrl: string | null): string | null {
  return imageUrl ?? FALLBACK_PHOTO[productId] ?? null
}
