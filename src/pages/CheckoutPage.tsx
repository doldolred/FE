import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { fetchCart } from '../api/cart'
import { createOrder } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import type { CreateOrderRequest } from '../api/types'
import OrderSummaryBox from '../components/order/OrderSummaryBox'
import PayMethodPicker from '../components/order/PayMethodPicker'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { getFieldErrors } from '../lib/errors'
import { formatPrice } from '../lib/format'
import { PAYMENT_ENABLED, type PayMethod } from '../lib/payment'
import { usePayment } from '../hooks/usePayment'
import { useAuthStore } from '../stores/authStore'

export default function CheckoutPage() {
  const memberName = useAuthStore((s) => s.member?.name ?? '')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [form, setForm] = useState<CreateOrderRequest>({
    receiverName: memberName,
    receiverPhone: '',
    zipcode: '',
    address1: '',
    address2: '',
    memo: '',
  })
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const { pay, paying } = usePayment()
  const set = (key: keyof CreateOrderRequest) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const { data: cart, isPending, error } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart })

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      queryClient.invalidateQueries({ queryKey: queryKeys.products })
      queryClient.setQueryData(queryKeys.order(order.orderNumber), order)
      // 주문(결제 대기)을 먼저 만들고 그 금액으로 결제창을 띄운다. 키가 아직 없으면 결제 대기로 접수만
      if (PAYMENT_ENABLED) pay(order, payMethod)
      else navigate(`/mypage/orders/${order.orderNumber}?complete=1`, { replace: true })
    },
  })
  const fieldErrors = getFieldErrors(orderMutation.error)

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  // 주문 완료 직후에는 장바구니가 비므로 orderMutation 성공 여부를 같이 확인
  if (cart.items.length === 0 && !orderMutation.isSuccess) return <Navigate to="/cart" replace />

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    orderMutation.mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-10">
        <h1 className="text-2xl font-bold">주문/결제</h1>

        <section>
          <h2 className="mb-4 font-bold">배송지</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="받는 분" required maxLength={50} value={form.receiverName} onChange={set('receiverName')} error={fieldErrors.receiverName} />
            <Input
              label="연락처"
              required
              type="tel"
              placeholder="010-0000-0000"
              value={form.receiverPhone}
              onChange={set('receiverPhone')}
              error={fieldErrors.receiverPhone}
            />
            {/* TODO: 우편번호 검색(다음 주소 API) 연결 */}
            <Input label="우편번호" required maxLength={10} value={form.zipcode} onChange={set('zipcode')} error={fieldErrors.zipcode} />
            <Input label="주소" required className="sm:col-span-2" value={form.address1} onChange={set('address1')} error={fieldErrors.address1} />
            <Input label="상세주소" className="sm:col-span-2" value={form.address2} onChange={set('address2')} error={fieldErrors.address2} />
            <Input
              label="배송 메모"
              className="sm:col-span-2"
              placeholder="예) 문 앞에 놓아주세요"
              value={form.memo}
              onChange={set('memo')}
              error={fieldErrors.memo}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">주문 상품 {cart.items.length}개</h2>
            <Link to="/cart" className="text-sm text-neutral-500 hover:underline">
              장바구니 수정
            </Link>
          </div>
          <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
            {cart.items.map((item) => (
              <li key={item.id} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {item.productName} <span className="text-neutral-500">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatPrice(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
        </section>

        {PAYMENT_ENABLED && (
          <section>
            <PayMethodPicker value={payMethod} onChange={setPayMethod} disabled={orderMutation.isPending || paying} />
          </section>
        )}
      </div>

      <OrderSummaryBox totalPrice={cart.totalPrice}>
        {orderMutation.error && (
          <div className="mt-4">
            <ErrorMessage error={orderMutation.error} />
          </div>
        )}
        <Button type="submit" className="mt-6 w-full" disabled={orderMutation.isPending || paying}>
          {orderMutation.isPending || paying
            ? '결제 준비 중…'
            : `${formatPrice(cart.totalPrice)} ${PAYMENT_ENABLED ? '결제하기' : '주문하기'}`}
        </Button>
        <p className="mt-3 text-center text-xs text-neutral-500">
          {PAYMENT_ENABLED
            ? '결제창을 닫아도 주문은 30분 동안 남아 있어 다시 결제할 수 있어요.'
            : "결제 연동 전이라 주문은 '결제 대기'로 접수돼요."}
        </p>
      </OrderSummaryBox>
    </form>
  )
}
