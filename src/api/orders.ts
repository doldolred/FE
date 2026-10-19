import { api } from './client'
import type { CreateOrderRequest, OrderDetail, OrderSummary } from './types'

export const createOrder = (req: CreateOrderRequest) => api.post<OrderDetail>('/api/orders', req)

export const fetchOrders = () => api.get<OrderSummary[]>('/api/orders')

export const fetchOrder = (orderNumber: string) => api.get<OrderDetail>(`/api/orders/${orderNumber}`)

export const cancelOrder = (orderNumber: string) => api.post<OrderDetail>(`/api/orders/${orderNumber}/cancel`)
