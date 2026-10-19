import { apiGet } from './client'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
}

export const fetchProducts = () => apiGet<Product[]>('/api/products')
