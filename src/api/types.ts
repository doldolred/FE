// docs/api.md 와 1:1 로 맞춘 타입

export type Role = 'USER' | 'ADMIN'

export interface MemberSummary {
  id: number
  email: string
  name: string
  role: Role
}

export interface Member extends MemberSummary {
  phone: string | null
}

export interface SignupRequest {
  email: string
  password: string
  name: string
  phone?: string
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

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  member: MemberSummary
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
}

export interface CartItem {
  id: number
  productId: number
  productName: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface Cart {
  items: CartItem[]
  totalPrice: number
}

export interface AddCartItemRequest {
  productId: number
  quantity: number
}

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'

export interface CreateOrderRequest {
  receiverName: string
  receiverPhone: string
  zipcode: string
  address1: string
  address2?: string
  memo?: string
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
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderDetail {
  orderNumber: string
  status: OrderStatus
  totalPrice: number
  receiverName: string
  receiverPhone: string
  zipcode: string
  address1: string
  address2: string | null
  memo: string | null
  items: OrderItem[]
  createdAt: string
}
