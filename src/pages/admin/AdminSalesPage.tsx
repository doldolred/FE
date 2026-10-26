import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchSalesSummary } from '../../api/admin'
import type { SalesSummary } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { inputClass, kstDate } from '../../lib/admin'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { formatPrice } from '../../lib/format'

const PRESETS = [
  { label: '7일', days: 7 },
  { label: '30일', days: 30 },
  { label: '90일', days: 90 },
]

export default function AdminSalesPage() {
  const [from, setFrom] = useState(kstDate(29))
  const [to, setTo] = useState(kstDate(0))
  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'sales', from, to],
    queryFn: () => fetchSalesSummary(from, to),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">매출</h1>
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => {
              setFrom(kstDate(p.days - 1))
              setTo(kstDate(0))
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-100"
          >
            최근 {p.label}
          </button>
        ))}
        <input type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="시작일" />
        <span className="text-neutral-400">~</span>
        <input type="date" className={inputClass} value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="종료일" />
      </div>

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="매출 (결제완료~배송완료)" value={formatPrice(data.totalSales)} />
            <Stat label="주문 수" value={`${data.orderCount.toLocaleString()}건`} />
            <Stat label="객단가" value={formatPrice(data.averageOrderValue)} />
            <Stat label="취소" value={`${data.cancelledCount}건 · ${formatPrice(data.cancelledAmount)}`} sub={`결제 대기 ${data.pendingCount}건`} />
          </div>
          <Panel title="일별 매출">
            <DailyChart daily={data.daily} />
          </Panel>
          <Panel title="많이 팔린 상품">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-neutral-500">이 기간에 팔린 상품이 없어요.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-neutral-500">
                  <tr>
                    <th className="pb-2 font-medium">상품</th>
                    <th className="pb-2 text-right font-medium">수량</th>
                    <th className="pb-2 text-right font-medium">매출</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.topProducts.map((p) => (
                    <tr key={p.productId}>
                      <td className="py-2">{p.productName}</td>
                      <td className="py-2 text-right tabular-nums">{p.quantity.toLocaleString()}</td>
                      <td className="py-2 text-right tabular-nums">{formatPrice(p.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

/** 일별 매출 막대 — 한 계열이라 범례 없이 제목으로. 막대에 마우스를 올리면 날짜 · 매출 · 주문 수 */
function DailyChart({ daily }: { daily: SalesSummary['daily'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 960
  const H = 240
  const pad = { top: 12, right: 8, bottom: 28, left: 64 }
  const max = Math.max(1, ...daily.map((d) => d.sales))
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const plotW = W - pad.left - pad.right
  const plotH = H - pad.top - pad.bottom
  const slot = plotW / daily.length
  const barW = Math.max(2, Math.min(24, slot - 2)) // 막대 사이 2px 이상
  const y = (v: number) => pad.top + plotH - (v / top) * plotH
  const labelEvery = Math.ceil(daily.length / 8)
  const h = hover === null ? null : daily[hover]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="일별 매출 막대 차트">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e5e5" strokeWidth={1} />
            <text x={pad.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#737373">
              {t === 0 ? '0' : `${(t / 10000).toLocaleString()}만`}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2
          const barH = Math.max(0, pad.top + plotH - y(d.sales))
          const r = Math.min(4, barW / 2, barH)
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {/* 막대보다 큰 투명 영역으로 마우스를 잡는다 */}
              <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="transparent" />
              {barH > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(d.sales) + r} Q${x},${y(d.sales)} ${x + r},${y(d.sales)} H${x + barW - r} Q${x + barW},${y(d.sales)} ${x + barW},${y(d.sales) + r} V${y(0)} Z`}
                  fill={hover === i ? '#8e1b4a' : '#c0265f'}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={pad.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#737373">
                  {d.date.slice(5).replace('-', '/')}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow"
          style={{ left: `${((pad.left + hover * slot + slot / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <p className="font-semibold">{h.date}</p>
          <p>
            {formatPrice(h.sales)} · {h.orders}건
          </p>
        </div>
      )}
    </div>
  )
}

/** 눈금 간격을 1 · 2 · 5 × 10ⁿ 으로 */
function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1)))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}
