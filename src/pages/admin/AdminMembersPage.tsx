import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { changeMemberRole, fetchAdminMember, fetchAdminMembers } from '../../api/admin'
import Panel from '../../components/admin/Panel'
import { inputClass } from '../../lib/admin'
import OrderStatusBadge from '../../components/order/OrderStatusBadge'
import Button from '../../components/ui/Button'
import { Empty, ErrorMessage, Loading } from '../../components/ui/Status'
import { formatDate, formatPrice } from '../../lib/format'
import { useAuthStore } from '../../stores/authStore'
import { Pager } from './AdminOrdersPage'

export function AdminMembersPage() {
  const [draft, setDraft] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const { data, isPending, error, isFetching } = useQuery({
    queryKey: ['admin', 'members', keyword, page],
    queryFn: () => fetchAdminMembers(keyword, page),
    placeholderData: keepPreviousData,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setKeyword(draft)
    setPage(0)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">회원</h1>
      <form onSubmit={submit} className="flex gap-2">
        <input className={`${inputClass} flex-1`} placeholder="이메일 · 이름" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button type="submit">검색</Button>
      </form>
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data.content.length === 0 ? (
        <Empty>회원이 없어요.</Empty>
      ) : (
        <Panel>
          <div className={`overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">회원</th>
                  <th className="pb-2 font-medium">가입일</th>
                  <th className="pb-2 text-right font-medium">주문</th>
                  <th className="pb-2 text-right font-medium">구매액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.content.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="py-3">
                      <Link to={`/admin/members/${m.id}`} className="font-medium text-beet-800 hover:underline">
                        {m.name}
                      </Link>
                      {m.role === 'ADMIN' && <span className="ml-2 rounded bg-beet-50 px-1.5 py-0.5 text-xs text-beet-800">관리자</span>}
                      <p className="text-xs text-neutral-500">{m.email}</p>
                    </td>
                    <td className="py-3 text-neutral-600">{formatDate(m.createdAt)}</td>
                    <td className="py-3 text-right tabular-nums">{m.orderCount}건</td>
                    <td className="py-3 text-right tabular-nums">{formatPrice(m.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
        </Panel>
      )}
    </div>
  )
}

export function AdminMemberDetailPage() {
  const id = Number(useParams().id)
  const myId = useAuthStore((s) => s.member?.id)
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'member', id], queryFn: () => fetchAdminMember(id) })
  const roleMutation = useMutation({
    mutationFn: (role: 'USER' | 'ADMIN') => changeMemberRole(id, role),
    onSuccess: (res) => {
      queryClient.setQueryData(['admin', 'member', id], res)
      queryClient.invalidateQueries({ queryKey: ['admin', 'members'] })
    },
  })

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  const m = data.member
  const nextRole = m.role === 'ADMIN' ? 'USER' : 'ADMIN'

  return (
    <div className="space-y-6">
      <Link to="/admin/members" className="text-sm text-neutral-500 hover:underline">
        ← 회원 목록
      </Link>
      <h1 className="text-2xl font-bold">{m.name}</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="최근 주문">
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-neutral-500">주문이 없어요.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {data.recentOrders.map((o) => (
                <li key={o.orderNumber} className="flex items-center justify-between gap-3 py-2">
                  <Link to={`/admin/orders/${o.orderNumber}`} className="hover:underline">
                    {o.orderNumber} · {o.itemSummary}
                  </Link>
                  <span className="flex items-center gap-3">
                    <OrderStatusBadge status={o.status} />
                    <span className="tabular-nums">{formatPrice(o.totalPrice)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="정보">
          <dl className="space-y-1 text-sm">
            <div>이메일: {m.email}</div>
            <div>휴대폰: {m.phone ?? '-'}</div>
            <div>가입: {formatDate(m.createdAt)}</div>
            <div>
              주문 {m.orderCount}건 · {formatPrice(m.totalSpent)}
            </div>
            <div>권한: {m.role === 'ADMIN' ? '관리자' : '일반'}</div>
          </dl>
          {m.id !== myId && (
            <Button
              variant="secondary"
              className="mt-4 w-full"
              disabled={roleMutation.isPending}
              onClick={() => window.confirm(nextRole === 'ADMIN' ? '관리자로 바꿀까요? 관리자 화면 전체를 쓸 수 있게 돼요.' : '일반 회원으로 바꿀까요?') && roleMutation.mutate(nextRole)}
            >
              {nextRole === 'ADMIN' ? '관리자로 지정' : '관리자 해제'}
            </Button>
          )}
          {roleMutation.error && (
            <div className="mt-3">
              <ErrorMessage error={roleMutation.error} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
