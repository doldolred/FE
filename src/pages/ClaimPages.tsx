import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createClaim, fetchMyClaims, fetchOrderClaims, uploadClaimImage, withdrawClaim } from '../api/claims'
import { fetchOrder } from '../api/orders'
import { queryKeys } from '../api/queryKeys'
import type { Claim, ClaimReason, ClaimType, OrderDetail } from '../api/types'
import Button from '../components/ui/Button'
import { buttonClass } from '../components/ui/buttonStyles'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { claimableTypes, RETURN_DAYS, RETURN_SHIPPING_FEE } from '../lib/claims'
import { getErrorMessage, getFieldErrors } from '../lib/errors'
import { CLAIM_REASON_LABEL, CLAIM_STATUS_LABEL, CLAIM_TYPE_LABEL, formatDate, formatPrice } from '../lib/format'

const MAX_PHOTOS = 3

const REASONS: Record<ClaimType, ClaimReason[]> = {
  CANCEL: ['CHANGE_OF_MIND', 'DELAYED', 'OTHER'],
  RETURN: ['CHANGE_OF_MIND', 'DEFECTIVE', 'WRONG_ITEM', 'OTHER'],
  EXCHANGE: ['DEFECTIVE', 'WRONG_ITEM'],
}

const statusClass = (c: Claim) =>
  c.status === 'COMPLETED'
    ? 'bg-neutral-900 text-white'
    : c.status === 'REJECTED' || c.status === 'WITHDRAWN'
      ? 'bg-neutral-100 text-neutral-500'
      : 'bg-beet-50 text-beet-800'

/** 신청 한 건 요약 — 주문 상세 · 내 신청 목록 */
export function ClaimItem({ claim: c, showOrder = false }: { claim: Claim; showOrder?: boolean }) {
  const queryClient = useQueryClient()
  const withdraw = useMutation({
    mutationFn: () => withdrawClaim(c.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      queryClient.invalidateQueries({ queryKey: ['order-claims'] })
    },
  })
  return (
    <li className="rounded-xl border border-neutral-200 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <b>{CLAIM_TYPE_LABEL[c.type]}</b>
        <span className="text-neutral-500">· {CLAIM_REASON_LABEL[c.reason]}</span>
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${statusClass(c)}`}>{CLAIM_STATUS_LABEL[c.status]}</span>
      </div>
      {showOrder && (
        <p className="mt-1 text-xs text-neutral-500">
          주문{' '}
          <Link to={`/mypage/orders/${c.orderNumber}`} className="underline">
            {c.orderNumber}
          </Link>
        </p>
      )}
      <p className="mt-2 break-keep whitespace-pre-line text-neutral-700">{c.detail}</p>
      {c.type !== 'EXCHANGE' && (
        <p className="mt-2 text-xs text-neutral-600">
          환불 {c.status === 'COMPLETED' ? '완료' : '예정'} {formatPrice(c.refundAmount)}
          {c.returnShippingFee > 0 && ` (반품 배송비 ${formatPrice(c.returnShippingFee)} 제외)`}
        </p>
      )}
      {c.rejectReason && <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs">거절 사유: {c.rejectReason}</p>}
      {c.exchangeTrackingNumber && (
        <p className="mt-2 text-xs">
          교환 상품 발송: {c.exchangeCourier} {c.exchangeTrackingNumber}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
        <span>{formatDate(c.createdAt)} 신청</span>
        {c.status === 'REQUESTED' && (
          <button
            type="button"
            className="font-semibold text-neutral-600 hover:underline disabled:opacity-40"
            disabled={withdraw.isPending}
            onClick={() => window.confirm('신청을 철회할까요?') && withdraw.mutate()}
          >
            신청 철회
          </button>
        )}
      </div>
      {withdraw.error && <p className="mt-1 text-xs text-red-600">{getErrorMessage(withdraw.error)}</p>}
    </li>
  )
}

/** 주문 상세 아래 — 이 주문의 신청 내역 + 새로 신청 */
export function OrderClaimsSection({ order }: { order: OrderDetail }) {
  const { data } = useQuery({ queryKey: ['order-claims', order.orderNumber], queryFn: () => fetchOrderClaims(order.orderNumber) })
  const types = claimableTypes(order)
  const open = data?.some((c) => c.status === 'REQUESTED' || c.status === 'APPROVED')
  if (!data?.length && types.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 font-bold">취소 · 반품 · 교환</h2>
      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((c) => (
            <ClaimItem key={c.id} claim={c} />
          ))}
        </ul>
      )}
      {types.length > 0 && !open && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {types.map((t) => (
            <Link key={t} to={`/mypage/orders/${order.orderNumber}/claim?type=${t}`} className={buttonClass('secondary')}>
              {CLAIM_TYPE_LABEL[t]} 신청
            </Link>
          ))}
          {order.status === 'DELIVERED' && <span className="text-xs text-neutral-500">배송 완료 후 {RETURN_DAYS}일 안에 신청할 수 있어요.</span>}
        </div>
      )}
    </section>
  )
}

/** /mypage/orders/:orderNumber/claim?type= — 취소 요청 · 반품 · 교환 신청 */
export function ClaimNewPage() {
  const orderNumber = useParams().orderNumber ?? ''
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: order, isPending, error } = useQuery({ queryKey: queryKeys.order(orderNumber), queryFn: () => fetchOrder(orderNumber) })
  const types = order ? claimableTypes(order) : []
  const asked = params.get('type') as ClaimType | null
  const [type, setType] = useState<ClaimType | null>(null)
  const current: ClaimType | null = type ?? (asked && types.includes(asked) ? asked : (types[0] ?? null))
  const [reason, setReason] = useState<ClaimReason | ''>('')
  const [detail, setDetail] = useState('')
  // 단순 변심 · 주문 실수 반품은 미개봉 상품만 (고객 정책)
  const [unopened, setUnopened] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const save = useMutation({
    mutationFn: () => createClaim(orderNumber, { type: current!, reason: reason as ClaimReason, detail, imageUrls: photos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-claims', orderNumber] })
      queryClient.invalidateQueries({ queryKey: ['claims'] })
      navigate(`/mypage/orders/${orderNumber}`, { replace: true })
    },
  })
  const fe = getFieldErrors(save.error)

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setUploadError('')
    try {
      for (const f of files) {
        const { url } = await uploadClaimImage(f)
        setPhotos((p) => [...p, url].slice(0, MAX_PHOTOS))
      }
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl">
        <Empty>지금은 신청할 수 없는 주문이에요.</Empty>
        <Link to={`/mypage/orders/${orderNumber}`} className="mt-6 inline-block text-sm text-neutral-500 hover:underline">
          ← 주문 상세
        </Link>
      </div>
    )
  }

  const fee = current === 'RETURN' && reason === 'CHANGE_OF_MIND' ? RETURN_SHIPPING_FEE : 0
  const refund = current === 'EXCHANGE' ? 0 : Math.max(0, order.totalPrice - fee)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">{CLAIM_TYPE_LABEL[current]} 신청</h1>
      <p className="mt-1 text-sm text-neutral-500">
        주문 {order.orderNumber} · {order.items.map((i) => `${i.productName} ${i.optionName} × ${i.quantity}`).join(', ')}
      </p>

      {types.length > 1 && (
        <div className="mt-6 flex gap-2" role="tablist">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={current === t}
              onClick={() => {
                setType(t)
                setReason('')
              }}
              className={`rounded-full border-2 px-4 py-2 text-sm font-bold ${current === t ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}
            >
              {CLAIM_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600">
        {current === 'CANCEL' && '상품 준비 중이라 관리자가 확인한 뒤 취소돼요. 이미 발송됐다면 취소가 어려울 수 있어요. 승인되면 결제 금액 전부를 환불해 드려요.'}
        {current === 'RETURN' &&
          `제품 수령일로부터 ${RETURN_DAYS}일 안에 신청할 수 있어요. 단순 변심 · 주문 실수로 인한 반품은 미개봉 상품에 한하여 가능하며, 왕복 배송비 ${formatPrice(RETURN_SHIPPING_FEE)}을 빼고 환불돼요. 파손 · 하자 · 오배송은 사진을 함께 올려 주세요. 반송 전 반드시 먼저 접수해 주세요 (임의 반송 시 처리가 지연되거나 거부될 수 있어요).`}
        {current === 'EXCHANGE' &&
          `파손 · 하자 · 오배송일 때 같은 상품으로 바꿔 드려요. 제품 수령일로부터 ${RETURN_DAYS}일 안에 사진과 함께 신청해 주세요. 단순 변심 · 주문 실수로 인한 교환(미개봉, 회수 · 재배송 비용 구매자 부담)은 1:1 문의나 고객센터로 접수해 주세요.`}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">이유</legend>
          <div className="flex flex-wrap gap-2">
            {REASONS[current].map((r) => (
              <label
                key={r}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${reason === r ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300'}`}
              >
                <input type="radio" name="reason" required className="sr-only" checked={reason === r} onChange={() => setReason(r)} />
                {CLAIM_REASON_LABEL[r]}
              </label>
            ))}
          </div>
          {fe.reason && <p className="mt-1 text-sm text-red-600">{fe.reason}</p>}
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">자세한 내용</span>
          <textarea
            className="min-h-32 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-neutral-900"
            required
            maxLength={2000}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={current === 'CANCEL' ? '취소하려는 이유를 적어 주세요.' : '어떤 문제가 있었는지 적어 주세요. 불량 · 파손은 사진이 있으면 빨라요.'}
          />
          {fe.detail && <p className="mt-1 text-sm text-red-600">{fe.detail}</p>}
        </label>

        {current === 'RETURN' && reason === 'CHANGE_OF_MIND' && (
          <label className="flex items-start gap-2 rounded-xl border border-beet-200 bg-beet-50 p-4 text-sm">
            <input type="checkbox" className="mt-0.5" required checked={unopened} onChange={(e) => setUnopened(e.target.checked)} />
            <span>
              포장을 뜯지 않은 미개봉 상품이에요. <span className="text-neutral-500">(개봉 · 일부 섭취 · 구성품 누락 시 반품이 어려워요)</span>
            </span>
          </label>
        )}

        {current !== 'CANCEL' && (
          <div>
            <p className="mb-2 text-sm font-semibold">
              사진 <span className="font-normal text-neutral-400">(선택, {MAX_PHOTOS}장까지)</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {photos.map((u) => (
                <div key={u} className="relative">
                  <img src={u} alt="올린 사진" className="h-20 w-20 rounded-lg border object-cover" />
                  <button
                    type="button"
                    aria-label="사진 빼기"
                    onClick={() => setPhotos((p) => p.filter((x) => x !== u))}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-neutral-900 text-xs font-bold text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-xs text-neutral-500 hover:border-neutral-900">
                  <span className="text-xl leading-none">+</span>
                  {uploading ? '올리는 중…' : '사진'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={uploading} onChange={onFiles} />
                </label>
              )}
            </div>
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          </div>
        )}

        {current !== 'EXCHANGE' && (
          <dl className="space-y-1 rounded-xl border border-neutral-200 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">결제 금액</dt>
              <dd>{formatPrice(order.totalPrice)}</dd>
            </div>
            {fee > 0 && (
              <div className="flex justify-between">
                <dt className="text-neutral-500">반품 배송비</dt>
                <dd>−{formatPrice(fee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-2 font-bold">
              <dt>환불 예정</dt>
              <dd className="text-beet-800">{formatPrice(refund)}</dd>
            </div>
          </dl>
        )}

        {save.error && !Object.keys(fe).length && <ErrorMessage error={save.error} />}

        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending || uploading || !reason || (current === 'RETURN' && reason === 'CHANGE_OF_MIND' && !unopened)}>
            신청하기
          </Button>
          <Link to={`/mypage/orders/${orderNumber}`} className={buttonClass('secondary')}>
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}

/** /mypage/claims — 내 취소 · 반품 · 교환 내역 */
export function MyClaimsPage() {
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: ['claims', page], queryFn: () => fetchMyClaims(page) })

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">취소 · 반품 · 교환 내역</h1>
      <p className="mt-1 text-sm text-neutral-500">신청은 주문 상세에서 할 수 있어요.</p>
      <div className="mt-6">
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <Empty>신청한 내역이 없어요.</Empty>
        ) : (
          <ul className="space-y-3">
            {data.content.map((c) => (
              <ClaimItem key={c.id} claim={c} showOrder />
            ))}
          </ul>
        )}
      </div>
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold">
          <button type="button" disabled={page <= 0} onClick={() => setPage(page - 1)} className="disabled:opacity-30">
            ← 이전
          </button>
          <span className="text-neutral-500 tabular-nums">
            {page + 1} / {data.totalPages}
          </span>
          <button type="button" disabled={page + 1 >= data.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-30">
            다음 →
          </button>
        </div>
      )}
      <Link to="/mypage" className="mt-10 inline-block text-sm text-neutral-500 hover:underline">
        ← 마이페이지
      </Link>
    </div>
  )
}
