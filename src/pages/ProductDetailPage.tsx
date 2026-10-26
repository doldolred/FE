import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { addCartItem } from '../api/cart'
import { fetchProduct } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import { MoreFromDoldol, Points, SpinPouch, Stage } from '../components/lineup/Stage'
import OptionPicker, { ShippingNote } from '../components/product/OptionPicker'
import ProductImage from '../components/product/ProductImage'
import QuantityStepper from '../components/ui/QuantityStepper'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { SELLING } from '../data/lineup'
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

  // 프로토타입 v4 상세 — 왼쪽 무대(사진 파우치를 끌어서 돌린다), 오른쪽 정보 · 옵션 · 구매
  const info = SELLING[product.id]

  return (
    <div>
      <section className="grid items-start gap-[clamp(24px,5vw,72px)] md:grid-cols-[1.05fr_1fr]">
        <div className="md:sticky md:top-24">
          {info ? (
            <Stage badge={product.soldOut ? '품절' : '판매중'} badgeRed={!product.soldOut} word={info.en}>
              <SpinPouch photos={info.photos} alt={product.name} />
            </Stage>
          ) : (
            <div className="overflow-hidden rounded-[28px] border-2 border-neutral-900 shadow-[8px_8px_0_#111]">
              <ProductImage src={product.imageUrl} alt={product.name} />
            </div>
          )}
        </div>

        <div className="dd-info">
          <p className="text-sm font-black tracking-[0.1em] text-[#e4002b] italic">DOLDOL · {info?.en ?? 'BEET'}</p>
          <h1 className="mt-2.5 text-[clamp(32px,4.2vw,56px)] leading-[1.08] font-black tracking-[-0.03em] break-keep">{product.name}</h1>
          {info && <p className="mt-2.5 font-extrabold text-neutral-500">{info.spec}</p>}
          {product.description && <p className="mt-5 max-w-[42ch] text-[clamp(15px,1.3vw,17px)] leading-[1.75] whitespace-pre-line">{product.description}</p>}
          {info && <Points items={info.points} />}

          <div className="mt-8 border-t-2 border-dashed border-neutral-900 pt-7">
            {option && (
              <p className="flex items-baseline gap-3">
                {option.discountRate > 0 && <span className="text-2xl font-black text-[#e4002b]">{option.discountRate}%</span>}
                <span className="text-[clamp(32px,3.2vw,44px)] font-black tracking-[-0.03em]">{formatPrice(option.price)}</span>
                {option.discountRate > 0 && <span className="text-sm text-neutral-400 line-through">{formatPrice(option.listPrice)}</span>}
              </p>
            )}

            <div className="mt-6">
              <p className="mb-2 text-sm font-extrabold">옵션</p>
              <OptionPicker
                options={product.options}
                value={option?.id ?? null}
                onChange={(optionId) => {
                  setPicked(optionId)
                  setQuantity(1)
                  setAdded(false)
                }}
              />
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex">
                <dt className="w-16 shrink-0 font-extrabold">배송</dt>
                <dd>
                  <ShippingNote />
                </dd>
              </div>
              <div className="flex items-center">
                <dt className="w-16 font-extrabold">수량</dt>
                <dd>
                  <QuantityStepper
                    value={quantity}
                    onChange={(v) => {
                      setQuantity(v)
                      setAdded(false)
                    }}
                    max={Math.max(1, Math.min(99, option?.stock ?? 1))}
                    disabled={soldOut}
                  />
                </dd>
              </div>
            </dl>

            <p className="mt-6 flex items-center justify-between font-bold">
              <span className="text-sm text-neutral-600">합계</span>
              <span className="text-2xl font-black">{formatPrice((option?.price ?? 0) * quantity)}</span>
            </p>

            {addMutation.error && (
              <div className="mt-4">
                <ErrorMessage error={addMutation.error} />
              </div>
            )}
            {added && (
              <p className="mt-4 rounded-2xl border-2 border-neutral-900 bg-white px-4 py-3 text-sm font-bold">
                장바구니에 담았어요.{' '}
                <Link to="/cart" className="text-[#e4002b] underline">
                  장바구니 보기
                </Link>
              </p>
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr]">
              <button type="button" className="dd-btn" disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(false)}>
                장바구니
              </button>
              <button type="button" className="dd-btn" data-primary="" disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(true)}>
                {soldOut ? '품절' : '바로 구매'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <MoreFromDoldol exceptProductId={product.id} />
    </div>
  )
}
