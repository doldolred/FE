import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createCoupon, deleteCoupon, fetchAdminCoupons, updateCoupon } from '../../api/admin'
import type { AdminCoupon, CouponRequest, DiscountType } from '../../api/types'
import Panel from '../../components/admin/Panel'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { getFieldErrors } from '../../lib/errors'
import { formatDate, formatPrice } from '../../lib/format'

const KEY = ['admin', 'coupons'] as const

const EMPTY: CouponRequest = {
  code: '',
  name: '',
  discountType: 'AMOUNT',
  discountValue: 3000,
  maxDiscount: null,
  minOrderAmount: 0,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perMemberLimit: 1,
  active: true,
}

/** ISO → datetime-local 값 (이 컴퓨터 시간대) */
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null)
const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

const discountLabel = (c: Pick<AdminCoupon, 'discountType' | 'discountValue' | 'maxDiscount'>) =>
  c.discountType === 'AMOUNT'
    ? `${formatPrice(c.discountValue)} 할인`
    : `${c.discountValue}% 할인${c.maxDiscount ? ` (최대 ${formatPrice(c.maxDiscount)})` : ''}`

function stateOf(c: AdminCoupon, now: number) {
  if (!c.active) return { label: '꺼짐', cls: 'text-neutral-400' }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: '예약', cls: 'text-sky-700' }
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: '기간 끝', cls: 'text-neutral-400' }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { label: '소진', cls: 'text-neutral-400' }
  return { label: '사용 중', cls: 'text-emerald-700' }
}

/** 할인코드 — 주문서에서 코드를 넣으면 상품 금액에서 깎는다 */
export default function AdminCouponsPage() {
  const [editing, setEditing] = useState<AdminCoupon | 'new' | null>(null)
  const [now] = useState(() => Date.now())
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: KEY, queryFn: fetchAdminCoupons })
  const remove = useMutation({ mutationFn: deleteCoupon, onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }) })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">할인코드</h1>
          <p className="mt-1 text-sm text-neutral-500">
            상품 금액에서만 깎아요(배송비 그대로). 무료배송 기준은 할인 전 금액이고, 결제 금액은 1,000원 아래로 안 내려가요. 주문이 취소되면 다시
            쓸 수 있어요.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>새 할인코드</Button>
      </div>

      {editing && <CouponForm key={editing === 'new' ? 'new' : editing.id} coupon={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}

      <Panel>
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">아직 할인코드가 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">코드</th>
                  <th className="pb-2 font-medium">할인</th>
                  <th className="pb-2 font-medium">조건</th>
                  <th className="pb-2 font-medium">기간</th>
                  <th className="pb-2 text-right font-medium">사용</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.map((c) => {
                  const st = stateOf(c, now)
                  return (
                    <tr key={c.id}>
                      <td className="py-3">
                        <b className="font-mono">{c.code}</b>
                        <span className="block text-xs text-neutral-500">{c.name}</span>
                      </td>
                      <td className="py-3">{discountLabel(c)}</td>
                      <td className="py-3 text-xs text-neutral-600">
                        {c.minOrderAmount > 0 ? `${formatPrice(c.minOrderAmount)} 이상` : '조건 없음'}
                        <span className="block">1인 {c.perMemberLimit}회</span>
                      </td>
                      <td className="py-3 text-xs text-neutral-600">
                        {c.startsAt || c.endsAt ? `${c.startsAt ? formatDate(c.startsAt) : '처음부터'} ~ ${c.endsAt ? formatDate(c.endsAt) : '계속'}` : '기간 없음'}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {c.usedCount}
                        {c.usageLimit != null && <span className="text-neutral-400"> / {c.usageLimit}</span>}
                      </td>
                      <td className={`py-3 text-xs font-bold ${st.cls}`}>{st.label}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button type="button" className="text-xs font-semibold text-neutral-700 hover:underline" onClick={() => setEditing(c)}>
                          고치기
                        </button>
                        {c.usedCount === 0 && (
                          <button
                            type="button"
                            className="ml-3 text-xs text-neutral-400 hover:text-red-600"
                            disabled={remove.isPending}
                            onClick={() => window.confirm(`${c.code} 를 지울까요?`) && remove.mutate(c.id)}
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {remove.error && (
          <div className="mt-3">
            <ErrorMessage error={remove.error} />
          </div>
        )}
      </Panel>
    </div>
  )
}

function CouponForm({ coupon, onDone }: { coupon: AdminCoupon | null; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CouponRequest>(coupon ? { ...coupon } : EMPTY)
  const set = (patch: Partial<CouponRequest>) => setForm((f) => ({ ...f, ...patch }))
  const save = useMutation({
    mutationFn: () => (coupon ? updateCoupon(coupon.id, form) : createCoupon(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      onDone()
    },
  })
  const fe = getFieldErrors(save.error)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }
  const err = (k: string) => fe[k] && <span className="mt-1 block text-xs text-red-600">{fe[k]}</span>

  return (
    <Panel title={coupon ? `${coupon.code} 고치기` : '새 할인코드'}>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">코드 {coupon && <span className="text-xs text-neutral-400">(바꿀 수 없어요)</span>}</span>
          <input
            className={`${inputClass} w-full font-mono uppercase`}
            required
            pattern="\s*[A-Za-z0-9_\-]{3,30}\s*"
            title="영문 · 숫자 · - · _ 3~30자"
            disabled={!!coupon}
            value={form.code}
            onChange={(e) => set({ code: e.target.value })}
            placeholder="AUTUMN10"
          />
          {err('code')}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">이름 (손님에게 보여요)</span>
          <input className={`${inputClass} w-full`} required maxLength={50} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="가을 맞이 할인" />
          {err('name')}
        </label>

        <fieldset className="md:col-span-2">
          <legend className="mb-1 text-sm font-medium">할인</legend>
          <div className="flex flex-wrap items-center gap-2">
            {(['AMOUNT', 'PERCENT'] as DiscountType[]).map((t) => (
              <label key={t} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${form.discountType === t ? 'border-neutral-900 font-semibold' : 'border-neutral-300'}`}>
                <input
                  type="radio"
                  className="sr-only"
                  checked={form.discountType === t}
                  onChange={() => set({ discountType: t, discountValue: t === 'AMOUNT' ? 3000 : 10, maxDiscount: null })}
                />
                {t === 'AMOUNT' ? '정액 (원)' : '정률 (%)'}
              </label>
            ))}
            <input
              type="number"
              className={`${inputClass} w-28`}
              required
              min={1}
              max={form.discountType === 'PERCENT' ? 90 : 1000000}
              value={form.discountValue}
              onChange={(e) => set({ discountValue: Number(e.target.value) })}
              aria-label="할인 값"
            />
            <span className="text-sm text-neutral-500">{form.discountType === 'AMOUNT' ? '원' : '%'}</span>
            {form.discountType === 'PERCENT' && (
              <>
                <span className="ml-3 text-sm text-neutral-500">최대</span>
                <input
                  type="number"
                  className={`${inputClass} w-28`}
                  min={100}
                  step={100}
                  value={form.maxDiscount ?? ''}
                  onChange={(e) => set({ maxDiscount: numOrNull(e.target.value) })}
                  placeholder="상한 없음"
                  aria-label="최대 할인"
                />
                <span className="text-sm text-neutral-500">원</span>
              </>
            )}
          </div>
          {err('discountValue')}
          {err('maxDiscount')}
        </fieldset>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">최소 주문 금액 (상품 금액, 0 = 조건 없음)</span>
          <input type="number" className={`${inputClass} w-full`} required min={0} step={1000} value={form.minOrderAmount} onChange={(e) => set({ minOrderAmount: Number(e.target.value) })} />
          {err('minOrderAmount')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">전체 수량 (비우면 무제한)</span>
            <input type="number" className={`${inputClass} w-full`} min={1} value={form.usageLimit ?? ''} onChange={(e) => set({ usageLimit: numOrNull(e.target.value) })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">한 사람당</span>
            <input type="number" className={`${inputClass} w-full`} required min={1} max={100} value={form.perMemberLimit} onChange={(e) => set({ perMemberLimit: Number(e.target.value) })} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">시작 (비우면 바로)</span>
          <input type="datetime-local" className={`${inputClass} w-full`} value={toLocalInput(form.startsAt)} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">끝 (비우면 계속)</span>
          <input type="datetime-local" className={`${inputClass} w-full`} value={toLocalInput(form.endsAt)} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
          사용 (끄면 손님이 쓸 수 없어요)
        </label>

        {save.error && !Object.keys(fe).length && (
          <div className="md:col-span-2">
            <ErrorMessage error={save.error} />
          </div>
        )}
        <div className="flex gap-2 md:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            {coupon ? '저장' : '만들기'}
          </Button>
          <Button variant="secondary" onClick={onDone}>
            취소
          </Button>
        </div>
      </form>
    </Panel>
  )
}
