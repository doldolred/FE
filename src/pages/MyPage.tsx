import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { changeMarketing, changePassword, fetchMe } from '../api/auth'
import { fetchOrders } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import type { OrderStatus, OrderSummary } from '../api/types'
import OrderStatusBadge from '../components/order/OrderStatusBadge'
import MyNav from '../components/store/MyNav'
import PageHead from '../components/store/PageHead'
import Button from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import Input from '../components/ui/Input'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { getFieldErrors } from '../lib/errors'
import { formatDate, formatPrice } from '../lib/format'
import { useAuthStore } from '../stores/authStore'
import { useWishStore } from '../stores/wishStore'

/** 주문 현황 숫자 칸 — 결제 대기는 결제 완료 칸에 같이 센다 */
const STAT_GROUPS: { label: string; statuses: OrderStatus[] }[] = [
  { label: '결제 완료', statuses: ['PENDING_PAYMENT', 'PAID'] },
  { label: '상품 준비', statuses: ['PREPARING'] },
  { label: '배송중', statuses: ['SHIPPING'] },
  { label: '배송 완료', statuses: ['DELIVERED'] },
]

/** /mypage — 마이페이지 홈: 인사 · 주문 현황 · 최근 주문 · 바로 가기 */
export default function MyPage() {
  const name = useAuthStore((s) => s.member?.name ?? '')
  const wishCount = useWishStore((s) => s.ids.length)
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: fetchOrders })

  return (
    <div>
      <MyNav />
      <section className="dd-box mb-6" data-tone="navy">
        <p className="dd-kicker text-xs tracking-[0.1em] text-[#e6f05a]">DOLDOL · MY PAGE</p>
        <h1 className="dd-display-ko mt-2 text-3xl break-keep md:text-4xl">
          {name}님, <span className="text-[#e6f05a]">오늘도 붉게!</span>
        </h1>
        <p className="mt-2 text-sm opacity-70">주문 · 배송 · 후기 · 문의를 여기서 한 번에 볼 수 있어요.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="dd-box">
            <div className="dd-box-title">
              <span>주문 현황</span>
              <Link to="/mypage/orders">전체 보기 →</Link>
            </div>
            {orders.isPending ? (
              <Loading />
            ) : orders.error ? (
              <ErrorMessage error={orders.error} />
            ) : (
              <div className="dd-stats">
                {STAT_GROUPS.map((g) => {
                  const n = orders.data.filter((o) => g.statuses.includes(o.status)).length
                  return (
                    <Link key={g.label} to="/mypage/orders" data-hot={n > 0 && g.label !== '배송 완료' ? '' : undefined}>
                      <b>{n}</b>
                      {g.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section className="dd-box">
            <div className="dd-box-title">
              <span>최근 주문</span>
              <Link to="/mypage/orders">전체 보기 →</Link>
            </div>
            {orders.isPending ? (
              <Loading />
            ) : orders.error ? (
              <ErrorMessage error={orders.error} />
            ) : orders.data.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm font-bold">아직 주문 내역이 없어요.</p>
                <Link to={{ pathname: '/', hash: '#lineup' }} className={buttonClass('primary', 'mt-4')}>
                  첫 주문 하러 가기
                </Link>
              </div>
            ) : (
              <OrderRows orders={orders.data.slice(0, 3)} />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Shortcut to="/wishlist" title="위시리스트" desc={wishCount > 0 ? `찜한 제품 ${wishCount}개` : '마음에 드는 제품을 찜해 두세요'} tone="pink" />
          <Shortcut to="/mypage/reviews" title="후기 쓰기" desc="배송 완료된 제품에 사진 후기를 남겨 주세요" tone="lime" />
          <Shortcut to="/mypage/inquiries/new" title="1:1 문의" desc="주문 · 배송 · 상품 무엇이든 물어보세요" />
          <Shortcut to="/mypage/claims" title="취소 · 반품 · 교환" desc="신청은 주문 상세에서, 진행은 여기서 확인" />
          <Shortcut to="/mypage/profile" title="내 정보" desc="연락처 · 소식 받기 · 비밀번호" />
          <Link to="/logout" className="block text-center text-sm font-bold underline underline-offset-4">
            로그아웃
          </Link>
        </aside>
      </div>
    </div>
  )
}

function Shortcut({ to, title, desc, tone }: { to: string; title: string; desc: string; tone?: 'pink' | 'lime' }) {
  return (
    <Link to={to} className="dd-box group flex items-center justify-between gap-3 py-4! transition-transform hover:-translate-y-0.5" data-tone={tone}>
      <span>
        <b className="block font-black">{title}</b>
        <span className="mt-0.5 block text-xs font-bold opacity-70">{desc}</span>
      </span>
      <span className="text-xl font-black transition-transform group-hover:translate-x-1" aria-hidden="true">
        →
      </span>
    </Link>
  )
}

/** 주문 줄 목록 — 홈 최근 주문 · 주문 내역 공용 */
function OrderRows({ orders }: { orders: OrderSummary[] }) {
  return (
    <ul className="dd-rows">
      {orders.map((o) => (
        <li key={o.orderNumber}>
          <Link to={`/mypage/orders/${o.orderNumber}`} className="group flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-xs text-neutral-500">
                {formatDate(o.createdAt)} · {o.orderNumber}
              </p>
              <p className="mt-1 font-black break-keep group-hover:underline">{o.itemSummary}</p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={o.status} />
              <span className="font-black">{formatPrice(o.totalPrice)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const ORDER_FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행중', statuses: ['PENDING_PAYMENT', 'PAID', 'PREPARING', 'SHIPPING'] },
  { key: 'done', label: '배송 완료', statuses: ['DELIVERED'] },
  { key: 'ended', label: '취소 · 반품', statuses: ['CANCELLED', 'RETURNED'] },
]

/** /mypage/orders — 주문 내역 전체 (상태로 거르기) */
export function MyOrdersPage() {
  const orders = useQuery({ queryKey: queryKeys.orders, queryFn: fetchOrders })
  const [filter, setFilter] = useState('all')
  const statuses = ORDER_FILTERS.find((f) => f.key === filter)?.statuses
  const list = orders.data?.filter((o) => !statuses || statuses.includes(o.status)) ?? []

  return (
    <div>
      <MyNav />
      <PageHead kicker="ORDERS" title="주문 내역" sub="주문을 누르면 배송 진행 · 취소 · 반품 · 문의를 할 수 있어요." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="주문 거르기">
        {ORDER_FILTERS.map((f) => (
          <button key={f.key} type="button" className="dd-choice px-4! py-2! text-sm" data-on={f.key === filter ? '' : undefined} aria-pressed={f.key === filter} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      {orders.isPending ? (
        <Loading />
      ) : orders.error ? (
        <ErrorMessage error={orders.error} />
      ) : list.length === 0 ? (
        <Empty>{filter === 'all' ? '아직 주문 내역이 없어요.' : '해당하는 주문이 없어요.'}</Empty>
      ) : (
        <section className="dd-box py-1!">
          <OrderRows orders={list} />
        </section>
      )}
    </div>
  )
}

/** /mypage/profile — 내 정보 · 소식 받기 · 비밀번호 변경 */
export function MyProfilePage() {
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe })
  const marketingMutation = useMutation({
    mutationFn: changeMarketing,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.me, data),
  })

  return (
    <div>
      <MyNav />
      <PageHead kicker="PROFILE" title="내 정보" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="dd-box h-fit">
          <h2>회원 정보</h2>
          {me.isPending ? (
            <Loading />
          ) : me.error ? (
            <ErrorMessage error={me.error} />
          ) : (
            <>
              <dl className="dd-rows text-sm">
                <InfoRow label="이름" value={me.data.name} />
                <InfoRow label="이메일" value={me.data.email} />
                <InfoRow label="휴대폰" value={me.data.phone ?? '-'} />
              </dl>
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-[#16173d] bg-[#fff7f0] px-4 py-3 text-sm font-bold">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#d42a68]"
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
              <p className="mt-4 text-xs text-neutral-500">
                이름 · 휴대폰 번호 변경이나 탈퇴는{' '}
                <Link to="/mypage/inquiries/new" className="font-bold underline">
                  1:1 문의
                </Link>
                로 알려 주세요.
              </p>
            </>
          )}
        </section>
        <ChangePasswordSection />
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-3">
      <dt className="w-16 shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 font-bold break-all">{value}</dd>
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
    <section className="dd-box">
      <h2>비밀번호 변경</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
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
          <p className="rounded-2xl border-2 border-[#16173d] bg-[#e6f05a] px-4 py-3 text-sm font-bold">비밀번호를 바꿨어요. 다른 기기에서는 로그아웃됐어요.</p>
        )}
        <Button type="submit" variant="secondary" disabled={mutation.isPending || mismatch}>
          비밀번호 바꾸기
        </Button>
      </form>
    </section>
  )
}
