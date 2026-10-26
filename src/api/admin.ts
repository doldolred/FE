import { api, qs } from './client'
import type {
  AdminMember,
  AdminMemberDetail,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminProduct,
  AdminProductRequest,
  ChangeOrderStatusRequest,
  OrderStatus,
  Page,
  Role,
  SalesSummary,
  ShippingArea,
} from './types'

// 매출
export const fetchSalesSummary = (from?: string, to?: string) =>
  api.get<SalesSummary>(`/api/admin/sales/summary${qs({ from, to })}`)

// 주문
export interface AdminOrderSearch {
  status?: OrderStatus | ''
  from?: string
  to?: string
  keyword?: string
  page?: number
  size?: number
}
export const fetchAdminOrders = (s: AdminOrderSearch) =>
  api.get<Page<AdminOrderSummary>>(`/api/admin/orders${qs({ ...s })}`)
export const fetchAdminOrder = (orderNumber: string) => api.get<AdminOrderDetail>(`/api/admin/orders/${orderNumber}`)
export const changeOrderStatus = (orderNumber: string, req: ChangeOrderStatusRequest) =>
  api.patch<AdminOrderDetail>(`/api/admin/orders/${orderNumber}/status`, req)

// 상품
export const fetchAdminProducts = () => api.get<AdminProduct[]>('/api/admin/products')
export const fetchAdminProduct = (id: number) => api.get<AdminProduct>(`/api/admin/products/${id}`)
export const createProduct = (req: AdminProductRequest) => api.post<AdminProduct>('/api/admin/products', req)
export const updateProduct = (id: number, req: AdminProductRequest) => api.put<AdminProduct>(`/api/admin/products/${id}`, req)
export const changeProductActive = (id: number, active: boolean) =>
  api.patch<AdminProduct>(`/api/admin/products/${id}/active`, { active })
export const uploadImage = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.upload<{ url: string }>('/api/admin/uploads', form)
}

// 회원
export const fetchAdminMembers = (keyword: string, page: number) =>
  api.get<Page<AdminMember>>(`/api/admin/members${qs({ keyword, page, size: 20 })}`)
export const fetchAdminMember = (id: number) => api.get<AdminMemberDetail>(`/api/admin/members/${id}`)
export const changeMemberRole = (id: number, role: Role) => api.patch<AdminMemberDetail>(`/api/admin/members/${id}/role`, { role })

// 배송 지역
export const fetchShippingAreas = () => api.get<ShippingArea[]>('/api/admin/shipping/areas')
export const createShippingArea = (req: Omit<ShippingArea, 'id'>) => api.post<ShippingArea>('/api/admin/shipping/areas', req)
export const deleteShippingArea = (id: number) => api.delete<void>(`/api/admin/shipping/areas/${id}`)
