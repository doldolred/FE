import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { queryKeys } from '../api/queryKeys'
import { createReview, deleteReview, fetchMyReviews, fetchWritableItems, uploadReviewImage } from '../api/reviews'
import { ReviewCard } from '../components/review/ProductReviews'
import { StarPicker } from '../components/review/Stars'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { getErrorMessage, getFieldErrors } from '../lib/errors'
import { formatDay } from '../lib/format'

const MAX_PHOTOS = 3

function Heading({ children }: { children: string }) {
  return (
    <>
      <p className="dd-kicker text-sm tracking-[0.1em] text-[#d42a68]">DOLDOL · REVIEW</p>
      <h1 className="dd-display-ko mt-2 text-4xl md:text-5xl">{children}</h1>
    </>
  )
}

/** /mypage/reviews — 쓸 수 있는 상품 + 내가 쓴 후기 */
export function MyReviewsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const writable = useQuery({ queryKey: queryKeys.writableReviews, queryFn: fetchWritableItems })
  const mine = useQuery({ queryKey: queryKeys.myReviews(page), queryFn: () => fetchMyReviews(page) })
  const remove = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  })

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div>
        <Heading>내 후기</Heading>
        <p className="mt-3 text-sm text-neutral-600">배송이 끝난 상품에 후기를 남길 수 있어요.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-black">후기를 기다리는 상품</h2>
        {writable.isPending ? (
          <Loading />
        ) : writable.error ? (
          <ErrorMessage error={writable.error} />
        ) : writable.data.length === 0 ? (
          <Empty>지금 후기를 쓸 상품이 없어요.</Empty>
        ) : (
          <ul className="divide-y divide-neutral-200 border-y-2 border-[#16173d]">
            {writable.data.map((w) => (
              <li key={w.orderItemId} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-bold">
                    {w.productName} <span className="font-normal text-neutral-500">· {w.optionName}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {w.deliveredAt ? `${formatDay(w.deliveredAt)} 배송 완료` : '배송 완료'} · 주문 {w.orderNumber}
                  </p>
                </div>
                <Link to={`/mypage/reviews/new?item=${w.orderItemId}`} className="dd-btn !h-11 !px-5 !text-sm" data-primary="">
                  후기 쓰기
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-black">내가 쓴 후기</h2>
        {mine.isPending ? (
          <Loading />
        ) : mine.error ? (
          <ErrorMessage error={mine.error} />
        ) : mine.data.content.length === 0 ? (
          <Empty>아직 쓴 후기가 없어요.</Empty>
        ) : (
          <>
            <ul className="dd-review-list">
              {mine.data.content.map((r) => (
                <li key={r.id} className="grid gap-2">
                  <ReviewCard review={r} showProduct />
                  <div className="flex items-center justify-between px-1 text-xs text-neutral-500">
                    <span>{r.hidden ? '관리자가 숨긴 후기예요. 다른 손님에게는 안 보여요.' : ''}</span>
                    <button
                      type="button"
                      className="font-semibold hover:underline disabled:opacity-40"
                      disabled={remove.isPending}
                      onClick={() => window.confirm('이 후기를 지울까요? 지우면 다시 쓸 수 있어요.') && remove.mutate(r.id)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {mine.data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold">
                <button type="button" disabled={page <= 0} onClick={() => setPage(page - 1)} className="disabled:opacity-30">
                  ← 이전
                </button>
                <span className="text-neutral-500 tabular-nums">
                  {page + 1} / {mine.data.totalPages}
                </span>
                <button type="button" disabled={page + 1 >= mine.data.totalPages} onClick={() => setPage(page + 1)} className="disabled:opacity-30">
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
        {remove.error && (
          <div className="mt-3">
            <ErrorMessage error={remove.error} />
          </div>
        )}
      </section>

      <Link to="/mypage" className="inline-block text-sm text-neutral-500 hover:underline">
        ← 마이페이지
      </Link>
    </div>
  )
}

/** /mypage/reviews/new?item=주문상품번호 — 별점 · 글 · 사진(3장) */
export function ReviewNewPage() {
  const [params] = useSearchParams()
  const itemId = Number(params.get('item'))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const writable = useQuery({ queryKey: queryKeys.writableReviews, queryFn: fetchWritableItems })
  const item = writable.data?.find((w) => w.orderItemId === itemId)

  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const save = useMutation({
    mutationFn: () => createReview({ orderItemId: itemId, rating, content, imageUrls: photos }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      navigate('/mypage/reviews', { replace: true })
    },
  })
  const fieldErrors = getFieldErrors(save.error)

  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setUploadError('')
    try {
      for (const f of files) {
        const { url } = await uploadReviewImage(f)
        setPhotos((p) => [...p, url].slice(0, MAX_PHOTOS))
      }
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  if (writable.isPending) return <Loading />
  if (writable.error) return <ErrorMessage error={writable.error} />
  if (!item) {
    return (
      <div className="mx-auto max-w-2xl">
        <Heading>후기 쓰기</Heading>
        <div className="mt-8">
          <Empty>후기를 쓸 수 없는 상품이에요. 이미 썼거나 아직 배송 전일 수 있어요.</Empty>
        </div>
        <Link to="/mypage/reviews" className="dd-btn mt-6">
          내 후기로
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Heading>후기 쓰기</Heading>
      <p className="mt-3 font-bold">
        {item.productName} <span className="font-normal text-neutral-500">· {item.optionName}</span>
      </p>

      <form onSubmit={submit} className="mt-8 space-y-7 border-t-2 border-[#16173d] pt-8">
        <div>
          <p className="mb-2 text-sm font-extrabold">별점</p>
          <StarPicker value={rating} onChange={setRating} />
          {fieldErrors.rating && <p className="mt-1 text-sm text-red-600">{fieldErrors.rating}</p>}
        </div>

        <label className="block">
          <span className="mb-2 flex justify-between text-sm font-extrabold">
            후기 <span className="font-normal text-neutral-400 tabular-nums">{content.length} / 1,000</span>
          </span>
          <textarea
            className="min-h-48 w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#16173d]"
            required
            minLength={10}
            maxLength={1000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="맛 · 색 · 마시는 방법 등 다른 분께 도움이 될 이야기를 10자 이상 남겨 주세요."
          />
          {fieldErrors.content && <p className="mt-1 text-sm text-red-600">{fieldErrors.content}</p>}
        </label>

        <div>
          <p className="mb-2 text-sm font-extrabold">
            사진 <span className="font-normal text-neutral-400">(선택, {MAX_PHOTOS}장까지)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {photos.map((u) => (
              <div key={u} className="relative">
                <img src={u} alt="올린 사진" className="h-24 w-24 rounded-xl border-2 border-[#16173d] object-cover" />
                <button
                  type="button"
                  aria-label="사진 빼기"
                  onClick={() => setPhotos((p) => p.filter((x) => x !== u))}
                  className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#16173d] text-sm font-black text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-400 text-xs font-bold text-neutral-500 hover:border-[#16173d]">
                <span className="text-2xl leading-none">+</span>
                {uploading ? '올리는 중…' : '사진 추가'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="sr-only" disabled={uploading} onChange={onFiles} />
              </label>
            )}
          </div>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          {Object.keys(fieldErrors).some((k) => k.startsWith('imageUrls')) && <p className="mt-2 text-sm text-red-600">사진을 다시 올려 주세요.</p>}
        </div>

        {save.error && !Object.keys(fieldErrors).length && <ErrorMessage error={save.error} />}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="dd-btn" data-primary="" disabled={save.isPending || uploading}>
            후기 남기기
          </button>
          <Link to="/mypage/reviews" className="dd-btn">
            취소
          </Link>
        </div>
      </form>
    </div>
  )
}
