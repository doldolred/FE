import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addCartItem } from '../api/cart'
import { fetchProduct } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import { MoreFromDoldol, Points, ProductPage, SpinPouch, Stage } from '../components/lineup/Stage'
import ProductImage from '../components/product/ProductImage'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { MAIN_PRODUCT_ID, SELLING } from '../data/lineup'
import { formatPrice } from '../lib/format'
import { useIsLoggedIn } from '../stores/authStore'

export default function ProductDetailPage() {
  const id = Number(useParams().id)
  const [params] = useSearchParams()
  const loggedIn = useIsLoggedIn()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [picked, setPicked] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const { data: product, isPending, error } = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProduct(id),
    enabled: Number.isInteger(id),
  })

  // 고른 옵션 → 주소의 ?option= → 품절 아닌 첫 옵션 (30포가 기본으로 잡힌다)
  const fromQuery = Number(params.get('option'))
  const option =
    product?.options.find((o) => o.id === picked) ??
    product?.options.find((o) => o.id === fromQuery && !o.soldOut) ??
    product?.options.find((o) => !o.soldOut) ??
    null

  const addMutation = useMutation({
    mutationFn: () => addCartItem({ optionId: option!.id, quantity }),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart, cart),
  })

  if (!Number.isInteger(id)) return <ErrorMessage error={new Error('잘못된 상품 주소입니다.')} />
  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  const soldOut = !option || option.soldOut

  const handleAdd = async (goCheckout: boolean) => {
    if (!loggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)
      return
    }
    try {
      await addMutation.mutateAsync()
    } catch {
      return // 에러는 addMutation.error 로 화면에 표시
    }
    if (goCheckout) navigate('/checkout')
    else setAdded(true)
  }

  // 프로토타입 v4 상세 (v4-product.html) — 제품 색 바탕, 왼쪽 무대(3D 파우치를 끌어서 돌린다), 오른쪽 정보 · 옵션 · 구매
  const info = SELLING[product.id] ?? SELLING[MAIN_PRODUCT_ID]
  const maxQty = Math.max(1, Math.min(99, option?.stock ?? 1))

  return (
    <ProductPage colors={info}>
      <section className="dd-hero">
        {SELLING[product.id] ? (
          <Stage badge={product.soldOut ? '일시품절' : '판매중'} word={info.en}>
            <SpinPouch label={product.name} />
          </Stage>
        ) : (
          <div className="overflow-hidden rounded-[28px] border-2 border-[#16173d] shadow-[8px_8px_0_#16173d]">
            <ProductImage src={product.imageUrl} alt={product.name} />
          </div>
        )}

        <div className="dd-info">
          <p className="en dd-kicker">DOLDOL · {info.en}</p>
          <h1>{product.name}</h1>
          <p className="spec">{info.spec}</p>
          {product.description && <p className="desc">{product.description}</p>}
          <Points items={info.points} />

          <div className="dd-buy">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="price">{option ? formatPrice(option.price) : '품절'}</span>
              {option && option.discountRate > 0 && (
                <span className="text-sm font-bold opacity-70">
                  <span className="mr-2 line-through">{formatPrice(option.listPrice)}</span>
                  {option.discountRate}% 할인
                </span>
              )}
            </div>

            <div role="radiogroup" aria-label="옵션" className="mt-5 grid gap-2">
              {product.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={o.id === option?.id}
                  disabled={o.soldOut}
                  className="dd-option"
                  onClick={() => {
                    setPicked(o.id)
                    setQuantity(1)
                    setAdded(false)
                  }}
                >
                  <span>
                    {o.name}
                    {o.soldOut && <span className="ml-2 text-xs font-bold">일시품절</span>}
                  </span>
                  <span className="tabular-nums">{formatPrice(o.price)}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="dd-qty" role="group" aria-label="수량">
                <button type="button" aria-label="하나 빼기" disabled={soldOut || quantity <= 1} onClick={() => setQuantity(quantity - 1)}>
                  −
                </button>
                <output aria-live="polite">{quantity}</output>
                <button type="button" aria-label="하나 더하기" disabled={soldOut || quantity >= maxQty} onClick={() => setQuantity(quantity + 1)}>
                  +
                </button>
              </div>
              <p className="m-0 font-bold opacity-80">
                합계 <b className="opacity-100">{formatPrice((option?.price ?? 0) * quantity)}</b>
              </p>
            </div>
            <p className="mt-3 text-sm opacity-70">배송비 3,000원 · 5만원 이상 무료배송 (제주 +3,000원 · 도서산간 +5,000원)</p>

            {addMutation.error && (
              <div className="mt-4 rounded-2xl bg-white p-1">
                <ErrorMessage error={addMutation.error} />
              </div>
            )}
            {added && (
              <p className="mt-4 rounded-2xl border-2 border-current px-4 py-3 text-sm font-bold">
                장바구니에 담았어요.{' '}
                <Link to="/cart" className="underline">
                  장바구니 보기
                </Link>
              </p>
            )}

            <div className="dd-actions">
              <button type="button" className="dd-btn" disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(false)}>
                장바구니
              </button>
              <button type="button" className="dd-btn" data-primary="" disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(true)}>
                {soldOut ? '품절' : '구매하기'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <MoreFromDoldol exceptProductId={product.id} />
    </ProductPage>
  )
}
