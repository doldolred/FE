import { lazy } from 'react'

// 관리자 화면은 손님이 받을 필요가 없어서 따로 나눠 받는다
export const AdminLayout = lazy(() => import('../../components/admin/AdminLayout'))
export const AdminSalesPage = lazy(() => import('./AdminSalesPage'))
export const AdminOrdersPage = lazy(() => import('./AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })))
export const AdminOrderDetailPage = lazy(() => import('./AdminOrdersPage').then((m) => ({ default: m.AdminOrderDetailPage })))
export const AdminProductsPage = lazy(() => import('./AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })))
export const AdminProductEditPage = lazy(() => import('./AdminProductsPage').then((m) => ({ default: m.AdminProductEditPage })))
export const AdminMembersPage = lazy(() => import('./AdminMembersPage').then((m) => ({ default: m.AdminMembersPage })))
export const AdminMemberDetailPage = lazy(() => import('./AdminMembersPage').then((m) => ({ default: m.AdminMemberDetailPage })))
export const AdminShippingPage = lazy(() => import('./AdminShippingPage'))
export const AdminInquiriesPage = lazy(() => import('./AdminInquiriesPage').then((m) => ({ default: m.AdminInquiriesPage })))
export const AdminInquiryDetailPage = lazy(() => import('./AdminInquiriesPage').then((m) => ({ default: m.AdminInquiryDetailPage })))
export const AdminBannersPage = lazy(() => import('./AdminBannersPage'))
export const AdminNoticesPage = lazy(() => import('./AdminNoticesPage').then((m) => ({ default: m.AdminNoticesPage })))
export const AdminNoticeEditPage = lazy(() => import('./AdminNoticesPage').then((m) => ({ default: m.AdminNoticeEditPage })))
