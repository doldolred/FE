import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createShippingArea, deleteShippingArea, fetchShippingAreas } from '../../api/admin'
import Panel from '../../components/admin/Panel'
import { inputClass } from '../../lib/admin'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { formatPrice } from '../../lib/format'

/** 제주 · 도서산간 추가 배송비 — 우편번호 구간으로 관리. CJ대한통운 도서산간 우편번호 목록을 보고 더한다 */
export default function AdminShippingPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', zipFrom: '', zipTo: '', extraFee: '5000' })
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'shipping-areas'], queryFn: fetchShippingAreas })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'shipping-areas'] })
  const create = useMutation({
    mutationFn: () => createShippingArea({ ...form, zipTo: form.zipTo || form.zipFrom, extraFee: Number(form.extraFee) }),
    onSuccess: () => {
      setForm({ name: '', zipFrom: '', zipTo: '', extraFee: form.extraFee })
      refresh()
    },
  })
  const remove = useMutation({ mutationFn: deleteShippingArea, onSuccess: refresh })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">배송 지역</h1>
        <p className="mt-1 text-sm text-neutral-500">
          기본 배송비 3,000원 · 50,000원 이상 무료. 아래 구간의 우편번호는 무료배송이어도 추가 배송비가 붙어요.
        </p>
      </div>

      <Panel title="구간 추가">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
          <input className={inputClass} placeholder="지역 이름 (예: 신안군)" required maxLength={50} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={`${inputClass} w-28`} placeholder="시작 우편번호" required pattern="\d{5}" inputMode="numeric" maxLength={5} value={form.zipFrom} onChange={(e) => setForm({ ...form, zipFrom: e.target.value })} />
          <span className="pb-2 text-neutral-400">~</span>
          <input className={`${inputClass} w-28`} placeholder="끝 (비우면 한 곳)" pattern="\d{5}" inputMode="numeric" maxLength={5} value={form.zipTo} onChange={(e) => setForm({ ...form, zipTo: e.target.value })} />
          <input className={`${inputClass} w-28`} type="number" min={0} step={500} required value={form.extraFee} onChange={(e) => setForm({ ...form, extraFee: e.target.value })} aria-label="추가 배송비" />
          <Button type="submit" disabled={create.isPending}>
            추가
          </Button>
        </form>
        {create.error && (
          <div className="mt-3">
            <ErrorMessage error={create.error} />
          </div>
        )}
      </Panel>

      <Panel title="지금 적용 중">
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="pb-2 font-medium">지역</th>
                <th className="pb-2 font-medium">우편번호</th>
                <th className="pb-2 text-right font-medium">추가 배송비</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="py-2">{a.name}</td>
                  <td className="py-2 tabular-nums">{a.zipFrom === a.zipTo ? a.zipFrom : `${a.zipFrom} ~ ${a.zipTo}`}</td>
                  <td className="py-2 text-right tabular-nums">{formatPrice(a.extraFee)}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-neutral-400 hover:text-red-600"
                      disabled={remove.isPending}
                      onClick={() => window.confirm(`${a.name} 구간을 지울까요?`) && remove.mutate(a.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  )
}
