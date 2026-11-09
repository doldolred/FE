import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { createAddress, deleteAddress, fetchAddresses, makeDefaultAddress, updateAddress } from '../api/addresses'
import { queryKeys } from '../api/queryKeys'
import type { Address, AddressRequest } from '../api/types'
import MyNav from '../components/store/MyNav'
import PageHead from '../components/store/PageHead'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { getErrorMessage, getFieldErrors } from '../lib/errors'
import { searchAddress } from '../lib/postcode'

const MAX_ADDRESSES = 10

/** /mypage/addresses — 자주 쓰는 배송지 저장 · 기본 배송지 정하기 (주문서에서 골라 쓴다) */
export default function AddressesPage() {
  const queryClient = useQueryClient()
  const addresses = useQuery({ queryKey: queryKeys.addresses, queryFn: fetchAddresses })
  // null: 목록만 / 'new': 새 배송지 / Address: 그 배송지 수정
  const [editing, setEditing] = useState<Address | 'new' | null>(null)
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses })

  const defaultMutation = useMutation({ mutationFn: makeDefaultAddress, onSuccess: refresh })
  const deleteMutation = useMutation({ mutationFn: deleteAddress, onSuccess: refresh })
  const actionError = defaultMutation.error ?? deleteMutation.error

  const handleDelete = (a: Address) => {
    if (window.confirm(`'${a.label}' 배송지를 지울까요?`)) deleteMutation.mutate(a.id)
  }

  const count = addresses.data?.length ?? 0

  return (
    <div className="mx-auto max-w-3xl">
      <MyNav />
      <PageHead kicker="ADDRESS" title="배송지 관리" sub={`자주 쓰는 배송지를 ${MAX_ADDRESSES}개까지 저장해 두고 주문서에서 골라 쓰세요.`} />

      {editing !== null ? (
        <AddressForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          first={count === 0}
          onDone={() => {
            refresh()
            setEditing(null)
          }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setEditing('new')} disabled={count >= MAX_ADDRESSES}>
            + 새 배송지
          </Button>
        </div>
      )}

      {actionError && <ErrorMessage error={actionError} />}

      {addresses.isPending ? (
        <Loading />
      ) : addresses.error ? (
        <ErrorMessage error={addresses.error} />
      ) : count === 0 ? (
        editing === null && <Empty>저장한 배송지가 없어요. 주문할 때 '배송지 목록에 저장'을 체크해도 돼요.</Empty>
      ) : (
        <ul className="mt-4 space-y-3">
          {addresses.data.map((a) => (
            <li key={a.id} className="dd-box">
              <div className="flex flex-wrap items-center gap-2">
                <b>{a.label}</b>
                {a.defaultAddress && (
                  <span className="rounded-full bg-[#da1f2e] px-2 py-0.5 text-xs font-bold text-white">기본 배송지</span>
                )}
              </div>
              <p className="mt-2 text-sm">
                {a.receiverName} · {a.receiverPhone}
              </p>
              <p className="mt-1 text-sm break-keep text-neutral-600">
                [{a.zipcode}] {a.address1} {a.address2}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setEditing(a)}>
                  수정
                </Button>
                {!a.defaultAddress && (
                  <Button variant="secondary" disabled={defaultMutation.isPending} onClick={() => defaultMutation.mutate(a.id)}>
                    기본 배송지로
                  </Button>
                )}
                <Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => handleDelete(a)}>
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 배송지 추가 · 수정 폼 — 우편번호는 주소 검색으로 */
function AddressForm({ initial, first, onDone, onCancel }: { initial: Address | null; first: boolean; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<AddressRequest>({
    label: initial?.label ?? (first ? '집' : ''),
    receiverName: initial?.receiverName ?? '',
    receiverPhone: initial?.receiverPhone ?? '',
    zipcode: initial?.zipcode ?? '',
    address1: initial?.address1 ?? '',
    address2: initial?.address2 ?? '',
    makeDefault: initial?.defaultAddress ?? first,
  })
  const [searchError, setSearchError] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: () => (initial ? updateAddress(initial.id, form) : createAddress(form)),
    onSuccess: onDone,
  })
  const fieldErrors = getFieldErrors(mutation.error)
  const set = (key: keyof AddressRequest) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSearch = async () => {
    setSearchError(null)
    try {
      const picked = await searchAddress()
      setForm((f) => ({ ...f, ...picked }))
    } catch (e) {
      setSearchError(getErrorMessage(e))
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="dd-box mb-6">
      <h2>{initial ? '배송지 수정' : '새 배송지'}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="배송지 이름" placeholder="예) 집, 회사" required maxLength={20} value={form.label} onChange={set('label')} error={fieldErrors.label} />
        <Input label="받는 분" required maxLength={50} value={form.receiverName} onChange={set('receiverName')} error={fieldErrors.receiverName} />
        <Input
          label="연락처"
          type="tel"
          placeholder="010-0000-0000"
          required
          className="sm:col-span-2"
          value={form.receiverPhone}
          onChange={set('receiverPhone')}
          error={fieldErrors.receiverPhone}
        />
        <div className="flex items-end gap-2 sm:col-span-2">
          <Input label="우편번호" required inputMode="numeric" maxLength={5} className="w-32" value={form.zipcode} onChange={set('zipcode')} error={fieldErrors.zipcode} />
          <Button variant="secondary" onClick={handleSearch} className="mb-px">
            주소 검색
          </Button>
        </div>
        {searchError && <p className="text-xs text-red-600 sm:col-span-2">{searchError}</p>}
        <Input label="주소" required className="sm:col-span-2" value={form.address1} onChange={set('address1')} error={fieldErrors.address1} />
        <Input label="상세주소" className="sm:col-span-2" value={form.address2} onChange={set('address2')} error={fieldErrors.address2} />
        {!initial?.defaultAddress && (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-bold sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#da1f2e]"
              checked={!!form.makeDefault}
              disabled={first}
              onChange={(e) => setForm((f) => ({ ...f, makeDefault: e.target.checked }))}
            />
            기본 배송지로 정하기
          </label>
        )}
      </div>
      {mutation.error && Object.keys(fieldErrors).length === 0 && (
        <div className="mt-4">
          <ErrorMessage error={mutation.error} />
        </div>
      )}
      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? '저장하는 중…' : '저장'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  )
}
