import { api } from './client'
import type { AddCartItemRequest, Cart } from './types'

export const fetchCart = () => api.get<Cart>('/api/cart')

export const addCartItem = (req: AddCartItemRequest) => api.post<Cart>('/api/cart/items', req)

export const updateCartItem = (itemId: number, quantity: number) =>
  api.patch<Cart>(`/api/cart/items/${itemId}`, { quantity })

export const removeCartItem = (itemId: number) => api.delete<Cart>(`/api/cart/items/${itemId}`)
