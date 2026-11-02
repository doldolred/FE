import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPointHistory, fetchPointSummary } from '../api/points'
import { queryKeys } from '../api/queryKeys'
import type { PointHistory } from '../api/types'
import MyNav from '../components/store/MyNav'
import PageHead from '../components/store/PageHead'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { RETURN_DAYS } from '../lib/claims'
import { formatDate, formatPrice } from '../lib/format'
import { POINT_TYPE_LABEL, validPeriodText } from '../lib/points'

/** /mypage/points — 적립금 잔액 · 곧 사라질 금액 · 내역 */
export default function PointsPage() {
  const [page, setPage] = useState(0)
  const summary = useQuery({ queryKey: queryKeys.points, queryFn: fetchPointSummary })
  const history = useQuery({ queryKey: queryKeys.pointHistory(page), queryFn: () => fetchPointHistory(page), placeholderData: keepPreviousData })

  return (
    <div className="mx-auto max-w-3xl">
      <MyNav />
      <PageHead kicker="POINTS" title="적립금" sub="구매확정하면 쌓이고, 다음 주문에서 현금처럼 쓸 수 있어요." />

      {summary.isPending ? (
        <Loading />
      ) : summary.error ? (
        <ErrorMessage error={summary.error} />
      ) : (
        <section className="dd-box" data-tone="navy">
          <p className="text-sm font-bold opacity-70">쓸 수 있는 적립금</p>
          <p className="dd-display mt-1 text-5xl text-[#f6d4cf] tabular-nums">{formatPrice(summary.data.balance)}</p>
          {summary.data.expiringSoon > 0 && (
            <p className="mt-3 text-sm font-bold">30일 안에 {formatPrice(summary.data.expiringSoon)}이 사라져요.</p>
          )}
          <ul className="mt-5 space-y-1 text-xs opacity-75">
            <li>· 구매확정하면 결제 금액(배송비 제외)의 {summary.data.earnRate}%가 쌓여요. 배송 완료 후 {RETURN_DAYS}일이 지나면 자동으로 확정돼요.</li>
            <li>
              · {formatPrice(summary.data.minUse)}부터 쓸 수 있고, 결제 금액은 {formatPrice(summary.data.minPayment)} 이상 남아야 해요.
            </li>
            <li>· 쌓인 날부터 {validPeriodText(summary.data.validDays)} 동안 쓸 수 있고, 먼저 사라질 적립금부터 써요.</li>
            <li>· 주문을 취소하거나 반품하면 쓴 적립금을 돌려드려요. 현금으로 바꿀 수는 없어요.</li>
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 font-bold">내역</h2>
        {history.isPending ? (
          <Loading />
        ) : history.error ? (
          <ErrorMessage error={history.error} />
        ) : history.data.content.length === 0 ? (
          <Empty>아직 적립금 내역이 없어요.</Empty>
        ) : (
          <ul className={`dd-box dd-rows py-1! ${history.isFetching ? 'opacity-60' : ''}`}>
            {history.data.content.map((h) => (
              <PointRow key={h.id} item={h} />
            ))}
          </ul>
        )}
        {history.data && history.data.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold">
            <button type="button" disabled={page <= 0} onClick={() => setPage(page - 1)} className="disabled:opacity-30">
              ← 이전
            </button>
            <span className="text-neutral-500 tabular-nums">
              {page + 1} / {history.data.totalPages}
            </span>
            <button type="button" disabled={page + 1 >= history.data.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-30">
              다음 →
            </button>
          </div>
        )}
      </section>

      <Link to="/mypage" className="mt-10 inline-block text-sm text-neutral-500 hover:underline">
        ← 마이페이지
      </Link>
    </div>
  )
}

function PointRow({ item: h }: { item: PointHistory }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 text-sm">
      <div className="min-w-0">
        <p className="font-black">{h.memo || POINT_TYPE_LABEL[h.type]}</p>
        <p className="mt-0.5 text-xs text-neutral-500">
          {formatDate(h.createdAt)}
          {h.orderNumber && (
            <>
              {' · '}
              <Link to={`/mypage/orders/${h.orderNumber}`} className="underline">
                {h.orderNumber}
              </Link>
            </>
          )}
          {h.expiresAt && h.amount > 0 && ` · ${formatDate(h.expiresAt)}까지`}
        </p>
      </div>
      <span className={`shrink-0 font-black tabular-nums ${h.amount > 0 ? 'text-[#da1f2e]' : 'text-neutral-500'}`}>
        {h.amount > 0 ? '+' : '−'}
        {formatPrice(Math.abs(h.amount))}
      </span>
    </li>
  )
}
