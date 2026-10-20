import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { queryKeys } from '../api/queryKeys'
import type { OrderDetail } from '../api/types'
import { getErrorMessage } from '../lib/errors'
import { startPayment, type PayMethod } from '../lib/payment'
import { useAuthStore } from '../stores/authStore'

export const failPath = (orderNumber: string, message: string) =>
  `/checkout/fail?orderNumber=${encodeURIComponent(orderNumber)}&message=${encodeURIComponent(message)}`

/**
 * 주문을 결제하고 결과 화면으로 보낸다.
 *  - 성공(이 화면에서 승인까지 끝난 경우) → 주문 상세 ?complete=1
 *  - 창을 닫음 · 실패 → /checkout/fail (주문은 결제 대기로 남아 다시 결제할 수 있다)
 *  - 페이지를 떠나는 방식이면 그대로 PG · BE 가 이어받는다
 */
export function usePayment() {
  const [paying, setPaying] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const member = useAuthStore((s) => s.member)

  const pay = async (order: OrderDetail, method: PayMethod) => {
    setPaying(true)
    try {
      const paid = await startPayment(order, method, { name: member?.name, email: member?.email })
      queryClient.setQueryData(queryKeys.order(paid.orderNumber), paid)
      queryClient.invalidateQueries({ queryKey: queryKeys.orders, exact: true })
      navigate(`/mypage/orders/${paid.orderNumber}?complete=1`, { replace: true })
    } catch (e) {
      navigate(failPath(order.orderNumber, getErrorMessage(e)), { replace: true })
    } finally {
      setPaying(false)
    }
  }

  return { pay, paying }
}
