import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RequireAuth from './components/RequireAuth'
import { Loading } from './components/ui/Status'
import CartPage from './pages/CartPage'
import CheckoutFailPage from './pages/CheckoutFailPage'
import CheckoutPage from './pages/CheckoutPage'
import ComingSoonPage from './pages/ComingSoonPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import NotFoundPage from './pages/NotFoundPage'
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
} from './pages/admin/lazy'
import PortoneRedirectPage from './pages/PortoneRedirectPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SignupPage from './pages/SignupPage'

const wait = (node: ReactNode) => <Suspense fallback={<Loading />}>{node}</Suspense>

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'lineup/:slug', element: <ComingSoonPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'password/forgot', element: <ForgotPasswordPage /> },
      { path: 'password/reset', element: <ResetPasswordPage /> },
      { path: 'terms', element: <LegalPage doc="terms" /> },
      { path: 'privacy', element: <LegalPage doc="privacy" /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/fail', element: <CheckoutFailPage /> },
          { path: 'payment/portone/redirect', element: <PortoneRedirectPage /> },
          { path: 'mypage', element: <MyPage /> },
          { path: 'mypage/orders/:orderNumber', element: <OrderDetailPage /> },
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
    ],
  },
])
