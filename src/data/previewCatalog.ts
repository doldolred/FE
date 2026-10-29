import type { Product } from '../api/types'

/**
 * 서버(BE)에 닿지 못할 때 보여 줄 미리보기 상품 — 운영 서버가 올라가기 전 Vercel 화면용.
 * 값은 DB 시드(V5 옵션 · V13 라인업)와 같다. preview: true 라서 상세에서 장바구니 · 구매를 막는다.
 * 서버가 응답하면 이 값은 쓰이지 않는다 (가격 · 재고 · 공개 여부는 늘 서버 기준).
 */
export const PREVIEW_PRODUCTS: Product[] = [
  {
    id: 1,
    name: '돌돌 제주산 100% NFC 레드비트즙',
    description: '제주산 비트를 통째로 착즙했어요. 물 · 설탕 · 첨가물 없이 비트만 담은 120ml 파우치.',
    imageUrl: null,
    status: 'SELLING',
    minPrice: 38000,
    soldOut: false,
    options: [
      { id: 1, name: '10포', listPrice: 16000, price: 13900, discountRate: 13, stock: 0, soldOut: true },
      { id: 2, name: '30포', listPrice: 48000, price: 38000, discountRate: 20, stock: 100, soldOut: false },
      { id: 3, name: '60포', listPrice: 96000, price: 75000, discountRate: 21, stock: 50, soldOut: false },
    ],
    enName: 'RED BEET',
    spec: '120ml × 30포 / 60포',
    points: ['비트 100%', '물 0% · 설탕 0%', '120ml 한 포'],
    theme: 'NAVY',
    art: 'POUCH',
    artFrontUrl: '/products/beet/pouch-art-front.webp',
    artBackUrl: '/products/beet/pouch-art-back.webp',
    preview: true,
  },
  {
    id: 2,
    name: '돌돌 비트 농축액',
    description: '비트를 진하게 졸여 담은 농축액. 물이나 탄산수에 타서, 요리에 한 스푼.',
    imageUrl: null,
    status: 'COMING_SOON',
    minPrice: 0,
    soldOut: true,
    options: [],
    enName: 'BEET EXTRACT',
    spec: '500ml',
    points: ['제주산 비트', '물에 타서 · 요리에', '500ml 유리병'],
    theme: 'PINK',
    art: 'BOTTLE',
    artFrontUrl: null,
    artBackUrl: null,
    preview: true,
  },
  {
    id: 3,
    name: '돌돌 비트 파우더',
    description: '비트를 말려 곱게 간 가루. 요거트 · 스무디 · 베이킹에 붉은 색을 한 스푼.',
    imageUrl: null,
    status: 'COMING_SOON',
    minPrice: 0,
    soldOut: true,
    options: [],
    enName: 'BEET POWDER',
    spec: '150g',
    points: ['제주산 비트 100%', '스무디 · 베이킹', '150g 유리병'],
    theme: 'LIME',
    art: 'JAR',
    artFrontUrl: null,
    artBackUrl: null,
    preview: true,
  },
]
