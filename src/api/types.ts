// BE 저장소의 docs/api.md 와 1:1 로 맞춘 타입

export type Role = 'USER' | 'ADMIN'

export interface MemberSummary {
  id: number
  email: string
  name: string
  role: Role
}

export interface Member extends MemberSummary {
  phone: string | null
  marketingAgreed: boolean
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  phone?: string
  /** 필수 동의 3가지 + 선택(마케팅) */
  agreeTerms: boolean
  agreePrivacy: boolean
  agreeAge: boolean
  agreeMarketing: boolean
}

export interface SignupResponse {
  id: number
  email: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** 리프레시 토큰은 HttpOnly 쿠키로 따로 온다 (자바스크립트에서 못 읽음) */
export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  member: MemberSummary
}

export interface ProductOption {
  id: number
  /** 예: 30포 */
  name: string
  /** 정상가 (할인 전) */
  listPrice: number
  price: number
  /** 정상가 대비 할인율(%) */
  discountRate: number
  stock: number
  soldOut: boolean
}

export interface Product {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  /** 품절 아닌 옵션 중 최저가 — "38,000원~" */
  minPrice: number
  soldOut: boolean
  options: ProductOption[]
}

export interface CartItem {
  id: number
  productId: number
  productName: string
  optionId: number
  optionName: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
  stock: number
  /** 판매중지된 옵션이면 false — 주문할 수 없다 */
  onSale: boolean
}

export interface Cart {
  items: CartItem[]
  itemsPrice: number
  /** 기본 배송비 미리보기 — 제주 · 도서 추가는 주문서에서 우편번호로 */
  shippingFee: number
  freeShippingThreshold: number
  totalPrice: number
}

export interface AddCartItemRequest {
  optionId: number
  quantity: number
}

export interface ShippingQuote {
  baseFee: number
  extraFee: number
  /** 추가 배송비가 붙는 지역 이름 (제주 · 울릉도 …) */
  areaName: string | null
  fee: number
  freeThreshold: number
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'

export interface CreateOrderRequest {
  receiverName: string
  receiverPhone: string
  zipcode: string
  address1: string
  address2?: string
  memo?: string
  /** 할인코드 (선택) — 서버가 다시 계산해 적용 */
  couponCode?: string
}

export interface OrderSummary {
  orderNumber: string
  status: OrderStatus
  totalPrice: number
  itemSummary: string
  createdAt: string
}

export interface OrderItem {
  productId: number
  productName: string
  optionId: number
  optionName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface PaymentInfo {
  provider: 'NICEPAY' | 'PORTONE'
  /** CANCELLED = 주문 취소로 환불됨 */
  status: 'PAID' | 'CANCELLED'
  method: string | null
  amount: number
  approvedAt: string
  cancelledAt: string | null
  receiptUrl: string | null
}

export interface OrderDetail {
  orderNumber: string
  status: OrderStatus
  itemsPrice: number
  /** 할인코드로 깎은 금액 (없으면 0) */
  discountAmount: number
  couponCode: string | null
  shippingFee: number
  /** = itemsPrice - discountAmount + shippingFee */
  totalPrice: number
  receiverName: string
  receiverPhone: string
  zipcode: string
  address1: string
  address2: string | null
  memo: string | null
  items: OrderItem[]
  /** 결제 승인 후에만 채워진다 */
  payment?: PaymentInfo | null
  createdAt: string
}

// ── 관리자 ──────────────────────────────────────────

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface SalesSummary {
  from: string
  to: string
  totalSales: number
  orderCount: number
  averageOrderValue: number
  cancelledCount: number
  cancelledAmount: number
  pendingCount: number
  daily: { date: string; sales: number; orders: number }[]
  topProducts: { productId: number; productName: string; quantity: number; sales: number }[]
}

export interface AdminOrderSummary {
  orderNumber: string
  status: OrderStatus
  totalPrice: number
  itemSummary: string
  memberEmail: string
  memberName: string
  receiverName: string
  createdAt: string
}

export interface AdminOrderDetail {
  order: OrderDetail
  memberId: number
  memberEmail: string
  memberName: string
  courier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

export interface ChangeOrderStatusRequest {
  status: OrderStatus
  courier?: string
  trackingNumber?: string
}

export interface AdminProductOption {
  id: number
  name: string
  listPrice: number
  price: number
  discountRate: number
  stock: number
  sortOrder: number
  active: boolean
}

export interface AdminProduct {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  active: boolean
  options: AdminProductOption[]
  createdAt: string
  updatedAt: string
}

export interface AdminProductRequest {
  name: string
  description: string
  imageUrl: string
  active: boolean
  /** id 가 있으면 수정, 없으면 추가, 빠진 옵션은 판매중지 */
  options: { id?: number; name: string; listPrice: number; price: number; stock: number; active: boolean }[]
}

export interface AdminMember {
  id: number
  email: string
  name: string
  phone: string | null
  role: Role
  createdAt: string
  orderCount: number
  totalSpent: number
}

export interface AdminMemberDetail {
  member: AdminMember
  recentOrders: OrderSummary[]
}

export interface ShippingArea {
  id: number
  name: string
  zipFrom: string
  zipTo: string
  extraFee: number
}

// ── 공지사항 ─────────────────────────────────────────

export interface Notice {
  id: number
  title: string
  /** 줄바꿈 그대로 보여 주는 일반 글 (HTML 아님) */
  content: string
  /** 목록 맨 위 고정 */
  pinned: boolean
  /** false = 손님에게 안 보임 (관리자 화면에만) */
  published: boolean
  createdAt: string
  updatedAt: string
}

export type NoticeRequest = Pick<Notice, 'title' | 'content' | 'pinned' | 'published'>

// ── 띠배너 ───────────────────────────────────────────

/** RED = 포인트 #E4002B, BLACK, WHITE */
export type BannerTheme = 'RED' | 'BLACK' | 'WHITE'

export interface Banner {
  id: number
  message: string
  /** 사이트 안 경로(/products/1) 또는 https 주소. null 이면 글만 */
  linkUrl: string | null
  theme: BannerTheme
  /** 비어 있으면 기간 제한 없음 */
  startsAt: string | null
  endsAt: string | null
  active: boolean
  sortOrder: number
}

export type BannerRequest = Omit<Banner, 'id'>

// ── 1:1 문의 ─────────────────────────────────────────

export type InquiryCategory = 'ORDER' | 'SHIPPING' | 'PRODUCT' | 'CANCEL' | 'MEMBER' | 'ETC'
export type InquiryStatus = 'WAITING' | 'ANSWERED'

export interface Inquiry {
  id: number
  category: InquiryCategory
  title: string
  content: string
  /** 관련 주문 (선택) */
  orderNumber: string | null
  status: InquiryStatus
  answer: string | null
  answeredAt: string | null
  createdAt: string
}

export interface CreateInquiryRequest {
  category: InquiryCategory
  title: string
  content: string
  orderNumber?: string
}

/** 관리자용 — 누가 물었는지까지 */
export interface AdminInquiry extends Inquiry {
  memberId: number
  memberEmail: string
  memberName: string
}

// ── 상품 후기 ────────────────────────────────────────

export interface Review {
  id: number
  productId: number
  productName: string
  /** 산 옵션 (예: 30포) */
  optionName: string
  rating: number
  content: string
  imageUrls: string[]
  /** 손님 · 회원 화면은 가린 이름(홍*동), 관리자는 그대로 */
  author: string
  best: boolean
  hidden: boolean
  reply: string | null
  repliedAt: string | null
  createdAt: string
  /** 관리자 화면에만 */
  memberId: number | null
  memberEmail: string | null
}

export interface ReviewSummary {
  total: number
  average: number
  /** 5점 → 1점 순서 */
  counts: number[]
}

export type ReviewSort = 'latest' | 'best' | 'rating_high' | 'rating_low'

/** 후기를 쓸 수 있는 주문 상품 (배송 완료 · 아직 안 씀) */
export interface WritableItem {
  orderItemId: number
  orderNumber: string
  productId: number
  productName: string
  optionName: string
  deliveredAt: string | null
}

export interface CreateReviewRequest {
  orderItemId: number
  rating: number
  content: string
  imageUrls: string[]
}

export type AdminReviewFilter = 'ALL' | 'HIDDEN' | 'BEST' | 'NO_REPLY'

export interface AdminReviewUpdate {
  hidden?: boolean
  best?: boolean
  /** 빈 글이면 답글 삭제 */
  reply?: string
}

// ── 할인코드 ─────────────────────────────────────────

/** 주문서 미리보기 — 지금 장바구니에 쓰면 얼마 깎이는지 */
export interface CouponCheck {
  code: string
  name: string
  itemsPrice: number
  discountAmount: number
}

export type DiscountType = 'AMOUNT' | 'PERCENT'

export interface AdminCoupon {
  id: number
  code: string
  name: string
  discountType: DiscountType
  /** AMOUNT 면 원, PERCENT 면 % */
  discountValue: number
  /** PERCENT 일 때 최대 할인 (원), 없으면 상한 없음 */
  maxDiscount: number | null
  minOrderAmount: number
  startsAt: string | null
  endsAt: string | null
  /** 전체 수량, null 이면 무제한 */
  usageLimit: number | null
  perMemberLimit: number
  usedCount: number
  active: boolean
  createdAt: string
}

export type CouponRequest = Omit<AdminCoupon, 'id' | 'usedCount' | 'createdAt'>
