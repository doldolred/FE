import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { changeMarketing, changePassword, fetchMe } from '../api/auth'
import { fetchOrders } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { getFieldErrors } from '../lib/errors'
import { formatDate, formatPrice } from '../lib/format'
import { useAuthStore } from '../stores/authStore'

export default function MyPage() {
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe })
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: fetchOrders })
  const marketingMutation = useMutation({
    mutationFn: changeMarketing,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.me, data),
  })

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-6 text-2xl font-bold">마이페이지</h1>
        {me.isPending ? (
          <Loading />
        ) : me.error ? (
          <ErrorMessage error={me.error} />
        ) : (
          <>
            <dl className="grid gap-3 rounded-2xl bg-neutral-50 p-6 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-500">이름</dt>
                <dd className="mt-1 font-medium">{me.data.name}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">이메일</dt>
                <dd className="mt-1 font-medium">{me.data.email}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">휴대폰</dt>
                <dd className="mt-1 font-medium">{me.data.phone ?? '-'}</dd>
              </div>
            </dl>
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-beet-700"
                checked={me.data.marketingAgreed}
                disabled={marketingMutation.isPending}
                onChange={(e) => marketingMutation.mutate(e.target.checked)}
              />
              신상품 · 이벤트 소식 받기 (마케팅 정보 수신 동의)
            </label>
            {marketingMutation.error && (
              <div className="mt-2">
                <ErrorMessage error={marketingMutation.error} />
              </div>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">주문 내역</h2>
        {orders.isPending ? (
          <Loading />
        ) : orders.error ? (
          <ErrorMessage error={orders.error} />
        ) : orders.data.length === 0 ? (
          <Empty>아직 주문 내역이 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
            {orders.data.map((o) => (
              <li key={o.orderNumber}>
                <Link
                  to={`/mypage/orders/${o.orderNumber}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-xs text-neutral-500">
                      {formatDate(o.createdAt)} · {o.orderNumber}
                    </p>
                    <p className="mt-1 font-medium">{o.itemSummary}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <OrderStatusBadge status={o.status} />
                    <span className="font-semibold">{formatPrice(o.totalPrice)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ChangePasswordSection />
    </div>
  )
}

/** 비밀번호 변경 — 성공하면 다른 기기는 로그아웃되고, 이 기기는 새 토큰으로 계속 로그인 */
function ChangePasswordSection() {
  const setLogin = useAuthStore((s) => s.setLogin)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const mismatch = form.confirm !== '' && form.next !== form.confirm
  const mutation = useMutation({
    mutationFn: () => changePassword(form.current, form.next),
    onSuccess: (res) => {
      setLogin(res)
      setForm({ current: '', next: '', confirm: '' })
    },
  })
  const fieldErrors = getFieldErrors(mutation.error)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => {
    mutation.reset()
    setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!mismatch) mutation.mutate()
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="grid max-w-md gap-4">
        <Input label="현재 비밀번호" type="password" autoComplete="current-password" required value={form.current} onChange={set('current')} error={fieldErrors.currentPassword} />
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상"
          required
          minLength={8}
          maxLength={64}
          value={form.next}
          onChange={set('next')}
          error={fieldErrors.newPassword}
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={set('confirm')}
          error={mismatch ? '비밀번호가 일치하지 않아요.' : undefined}
        />
        {mutation.error && <ErrorMessage error={mutation.error} />}
        {mutation.isSuccess && (
          <p className="rounded-lg bg-beet-50 px-4 py-3 text-sm text-beet-800">비밀번호를 바꿨어요. 다른 기기에서는 로그아웃됐어요.</p>
        )}
        <Button type="submit" variant="secondary" disabled={mutation.isPending || mismatch}>
          비밀번호 바꾸기
        </Button>
      </form>
    </section>
  )
}
