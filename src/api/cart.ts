import { api, qs } from './client'
import type { AddCartItemRequest, Cart, ShippingQuote } from './types'

export const fetchCart = () => api.get<Cart>('/api/cart')

export const addCartItem = (req: AddCartItemRequest) => api.post<Cart>('/api/cart/items', req)

export const updateCartItem = (itemId: number, quantity: number) =>
  api.patch<Cart>(`/api/cart/items/${itemId}`, { quantity })

export const removeCartItem = (itemId: number) => api.delete<Cart>(`/api/cart/items/${itemId}`)

/** 배송비 미리보기 — 우편번호를 넣으면 제주 · 도서 추가 배송비까지 */
export const fetchShippingQuote = (itemsPrice: number, zipcode?: string) =>
  api.get<ShippingQuote>(`/api/shipping/quote${qs({ itemsPrice, zipcode })}`)
