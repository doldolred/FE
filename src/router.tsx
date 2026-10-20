import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RequireAuth from './components/RequireAuth'
import CartPage from './pages/CartPage'
import CheckoutFailPage from './pages/CheckoutFailPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MyPage from './pages/MyPage'
import NotFoundPage from './pages/NotFoundPage'
import OrderDetailPage from './pages/OrderDetailPage'
import PortoneRedirectPage from './pages/PortoneRedirectPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SignupPage from './pages/SignupPage'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
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
])
