import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completePortonePayment } from '../api/payments'
import { queryKeys } from '../api/queryKeys'
import { Loading } from '../components/ui/Status'
import { failPath } from '../hooks/usePayment'
import { getErrorMessage } from '../lib/errors'

/**
 * 포트원 모바일 결제 후 돌아오는 곳 (?paymentId=...&code=...&message=...).
 * code 가 있으면 실패, 없으면 BE 에 완료를 알리고 주문 상세로. paymentId = 주문번호.
 */
export default function PortoneRedirectPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return // StrictMode 에서 두 번 부르지 않게
    started.current = true

    const paymentId = params.get('paymentId') ?? ''
    const code = params.get('code')
    if (!paymentId) {
      navigate('/', { replace: true })
      return
    }
    if (code) {
      navigate(failPath(paymentId, params.get('message') || '결제가 취소되었어요.'), { replace: true })
      return
    }
    completePortonePayment(paymentId)
      .then((order) => {
        queryClient.setQueryData(queryKeys.order(order.orderNumber), order)
        queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true })
        navigate(`/mypage/orders/${order.orderNumber}?complete=1`, { replace: true })
      })
      .catch((e: unknown) => navigate(failPath(paymentId, getErrorMessage(e)), { replace: true }))
  }, [params, navigate, queryClient])

  return <Loading />
}
