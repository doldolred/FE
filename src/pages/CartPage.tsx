import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, updateCartItem } from '../api/cart'
import { queryKeys } from '../api/queryKeys'
import OrderSummaryBox from '../components/order/OrderSummaryBox'
import CheckoutSteps from '../components/store/CheckoutSteps'
import PageHead from '../components/store/PageHead'
import ProductThumb from '../components/store/ProductThumb'
import { buttonClass } from '../components/ui/buttonStyles'
import QuantityStepper from '../components/ui/QuantityStepper'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { formatPrice } from '../lib/format'
import { useWishStore } from '../stores/wishStore'

export default function CartPage() {
  const queryClient = useQueryClient()
  const wishCount = useWishStore((s) => s.ids.length)
  const { data: cart, isPending, error } = useQuery({ queryKey: queryKeys.cart, queryFn: fetchCart })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => updateCartItem(itemId, quantity),
    onSuccess: (data) => queryClient.setQueryData(queryKeys.cart, data),
  })
  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.cart, data),
  })
  const busy = updateMutation.isPending || removeMutation.isPending
  const mutationError = updateMutation.error ?? removeMutation.error

  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  // 판매가 끝났거나 재고보다 많이 담은 항목이 있으면 주문할 수 없다
  const blocked = cart.items.some((i) => !i.onSale || i.quantity > i.stock)

  if (cart.items.length === 0) {
    return (
      <div className="dd-hero-note">
        <p className="big">Empty!</p>
        <h1>장바구니가 비어 있어요</h1>
        <p>매일 한 포, 붉은 습관을 담아 보세요.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to={{ pathname: '/', hash: '#lineup' }} className={buttonClass('primary')}>
            제품 보러 가기
          </Link>
          {wishCount > 0 && (
            <Link to="/wishlist" className={buttonClass('secondary')}>
              위시리스트 {wishCount}개 보기
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <CheckoutSteps current={0} />
      <PageHead kicker="CART" title="장바구니" sub={`${cart.items.length}개 상품을 담았어요.`} />
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
          {mutationError && <ErrorMessage error={mutationError} />}
          <ul className="dd-box dd-rows py-0!">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-5">
                <Link to={`/products/${item.productId}?option=${item.optionId}`} className="w-20 shrink-0 sm:w-24">
                  <ProductThumb productId={item.productId} imageUrl={item.imageUrl} name={item.productName} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <Link to={`/products/${item.productId}?option=${item.optionId}`} className="font-black break-keep hover:underline">
                      {item.productName}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.optionName} · {formatPrice(item.unitPrice)}
                    </p>
                    {!item.onSale ? (
                      <p className="mt-1 text-xs font-bold text-red-600">판매가 끝난 옵션이에요. 삭제해 주세요.</p>
                    ) : item.quantity > item.stock ? (
                      <p className="mt-1 text-xs font-bold text-red-600">{item.stock === 0 ? '일시품절이에요.' : `재고가 ${item.stock}개 남았어요.`}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <QuantityStepper
                      value={item.quantity}
                      max={Math.max(1, Math.min(99, item.stock))}
                      disabled={busy || !item.onSale}
                      onChange={(quantity) => updateMutation.mutate({ itemId: item.id, quantity })}
                    />
                    <span className="w-24 text-right font-black">{formatPrice(item.lineTotal)}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeMutation.mutate(item.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#16173d] bg-white text-sm font-black hover:bg-[#f6c3d4]"
                      aria-label={`${item.productName} 삭제`}
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link to={{ pathname: '/', hash: '#lineup' }} className="inline-block text-sm font-bold underline underline-offset-4">
            ← 쇼핑 계속하기
          </Link>
        </section>

        <OrderSummaryBox itemsPrice={cart.itemsPrice} shippingFee={cart.shippingFee} freeThreshold={cart.freeShippingThreshold}>
          <p className="mt-3 text-xs text-neutral-500">제주 · 도서산간은 주문서에서 주소를 넣으면 추가 배송비가 붙어요.</p>
          {blocked ? (
            <p className="ui-alert mt-6 px-4 py-3 text-center text-sm text-red-700">주문할 수 없는 상품을 먼저 정리해 주세요.</p>
          ) : (
            <Link to="/checkout" className={buttonClass('primary', 'mt-6 w-full')}>
              주문하기 →
            </Link>
          )}
        </OrderSummaryBox>
      </div>
    </>
  )
}
