import { api } from './client'
import type { Address, AddressRequest } from './types'

/** 내 배송지 — 기본 배송지가 맨 앞 (로그인 필요) */
export const fetchAddresses = () => api.get<Address[]>('/api/addresses')

/** 첫 배송지는 자동으로 기본 배송지가 된다. 10개까지 */
export const createAddress = (req: AddressRequest) => api.post<Address>('/api/addresses', req)

export const updateAddress = (id: number, req: AddressRequest) => api.put<Address>(`/api/addresses/${id}`, req)

export const makeDefaultAddress = (id: number) => api.patch<Address>(`/api/addresses/${id}/default`)

/** 기본 배송지를 지우면 가장 최근 배송지가 기본이 된다 */
export const deleteAddress = (id: number) => api.delete<void>(`/api/addresses/${id}`)
