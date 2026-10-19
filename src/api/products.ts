import { api } from './client'
import type { Product } from './types'

export const fetchProducts = () => api.get<Product[]>('/api/products')

export const fetchProduct = (id: number) => api.get<Product>(`/api/products/${id}`)
