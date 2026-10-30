import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RequireAuth from './components/RequireAuth'
import { Loading } from './components/ui/Status'
import AboutPage from './pages/AboutPage'
import CartPage from './pages/CartPage'
import ContactPage from './pages/ContactPage'
import CheckoutFailPage from './pages/CheckoutFailPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import FaqPage from './pages/FaqPage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import MyPage, { MyOrdersPage, MyProfilePage } from './pages/MyPage'
import LogoutPage from './pages/LogoutPage'
import WishlistPage from './pages/WishlistPage'
import NotFoundPage from './pages/NotFoundPage'
import { ClaimNewPage, MyClaimsPage } from './pages/ClaimPages'
import { InquiryDetailPage, InquiryListPage, InquiryNewPage } from './pages/InquiryPages'
import { MyReviewsPage, ReviewNewPage } from './pages/ReviewPages'
import { NoticeDetailPage, NoticeListPage } from './pages/NoticePages'
import OrderDetailPage from './pages/OrderDetailPage'
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages'
// 관리자 화면은 손님이 받을 필요가 없어서 따로 나눠 받는다 (lazy)
import {
  AdminLayout,
  AdminSalesPage,
  AdminOrdersPage,
  AdminOrderDetailPage,
  AdminProductsPage,
  AdminProductEditPage,
  AdminMembersPage,
  AdminMemberDetailPage,
  AdminShippingPage,
  AdminBannersPage,
  AdminClaimsPage,
  AdminClaimDetailPage,
  AdminCouponsPage,
  AdminReviewsPage,
  AdminInquiriesPage,
  AdminInquiryDetailPage,
  AdminNoticesPage,
  AdminNoticeEditPage,
} from './pages/admin/lazy'
import PortoneRedirectPage from './pages/PortoneRedirectPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProductsPage from './pages/ProductsPage'
import SignupPage from './pages/SignupPage'

const wait = (node: ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'notices', element: <NoticeListPage /> },
      { path: 'notices/:id', element: <NoticeDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'password/forgot', element: <ForgotPasswordPage /> },
      { path: 'password/reset', element: <ResetPasswordPage /> },
      { path: 'terms', element: <LegalPage doc="terms" /> },
      { path: 'privacy', element: <LegalPage doc="privacy" /> },
      { path: 'cookies', element: <LegalPage doc="cookies" /> },
      { path: 'refund-policy', element: <LegalPage doc="refund" /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'logout', element: <LogoutPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/fail', element: <CheckoutFailPage /> },
          { path: 'payment/portone/redirect', element: <PortoneRedirectPage /> },
          { path: 'mypage', element: <MyPage /> },
          { path: 'mypage/orders', element: <MyOrdersPage /> },
          { path: 'mypage/profile', element: <MyProfilePage /> },
          { path: 'mypage/orders/:orderNumber', element: <OrderDetailPage /> },
          { path: 'mypage/orders/:orderNumber/claim', element: <ClaimNewPage /> },
          { path: 'mypage/claims', element: <MyClaimsPage /> },
          { path: 'mypage/reviews', element: <MyReviewsPage /> },
          { path: 'mypage/reviews/new', element: <ReviewNewPage /> },
          { path: 'mypage/inquiries', element: <InquiryListPage /> },
          { path: 'mypage/inquiries/new', element: <InquiryNewPage /> },
          { path: 'mypage/inquiries/:id', element: <InquiryDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: wait(<AdminLayout />),
    children: [
      { index: true, element: wait(<AdminSalesPage />) },
      { path: 'orders', element: wait(<AdminOrdersPage />) },
      { path: 'orders/:orderNumber', element: wait(<AdminOrderDetailPage />) },
      { path: 'products', element: wait(<AdminProductsPage />) },
      { path: 'products/:id', element: wait(<AdminProductEditPage />) },
      { path: 'members', element: wait(<AdminMembersPage />) },
      { path: 'members/:id', element: wait(<AdminMemberDetailPage />) },
      { path: 'shipping', element: wait(<AdminShippingPage />) },
      { path: 'inquiries', element: wait(<AdminInquiriesPage />) },
      { path: 'inquiries/:id', element: wait(<AdminInquiryDetailPage />) },
      { path: 'reviews', element: wait(<AdminReviewsPage />) },
      { path: 'coupons', element: wait(<AdminCouponsPage />) },
      { path: 'claims', element: wait(<AdminClaimsPage />) },
      { path: 'claims/:id', element: wait(<AdminClaimDetailPage />) },
      { path: 'banners', element: wait(<AdminBannersPage />) },
      { path: 'notices', element: wait(<AdminNoticesPage />) },
      { path: 'notices/:id', element: wait(<AdminNoticeEditPage />) },
    ],
  },
])
