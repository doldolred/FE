import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, updateCartItem } from '../api/cart'
import { queryKeys } from '../api/queryKeys'
import ProductImage from '../components/product/ProductImage'
import { buttonClass } from '../components/ui/buttonStyles'
import OrderSummaryBox from '../components/order/OrderSummaryBox'
import QuantityStepper from '../components/ui/QuantityStepper'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
import { productImageSrc } from '../data/lineup'
import { formatPrice } from '../lib/format'

export default function CartPage() {
  const queryClient = useQueryClient()
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
      <Empty>
        <p>장바구니가 비어 있어요.</p>
        <Link to="/" className={buttonClass('primary', 'mt-6')}>
          상품 보러 가기
        </Link>
      </Empty>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="mb-6 text-2xl font-bold">장바구니</h1>
        {mutationError && (
          <div className="mb-4">
            <ErrorMessage error={mutationError} />
          </div>
        )}
        <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <Link to={`/products/${item.productId}?option=${item.optionId}`} className="w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductImage src={productImageSrc(item.productId, item.imageUrl)} alt={item.productName} className="text-sm" />
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <Link to={`/products/${item.productId}?option=${item.optionId}`} className="font-medium hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-500">
                    {item.optionName} · {formatPrice(item.unitPrice)}
                  </p>
                  {!item.onSale ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">판매가 끝난 옵션이에요. 삭제해 주세요.</p>
                  ) : item.quantity > item.stock ? (
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      {item.stock === 0 ? '일시품절이에요.' : `재고가 ${item.stock}개 남았어요.`}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <QuantityStepper
                    value={item.quantity}
                    max={Math.max(1, Math.min(99, item.stock))}
                    disabled={busy || !item.onSale}
                    onChange={(quantity) => updateMutation.mutate({ itemId: item.id, quantity })}
                  />
                  <span className="w-24 text-right font-semibold">{formatPrice(item.lineTotal)}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeMutation.mutate(item.id)}
                    className="text-sm text-neutral-400 hover:text-red-600"
                    aria-label={`${item.productName} 삭제`}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <OrderSummaryBox itemsPrice={cart.itemsPrice} shippingFee={cart.shippingFee} freeThreshold={cart.freeShippingThreshold}>
        <p className="mt-3 text-xs text-neutral-500">제주 · 도서산간은 주문서에서 주소를 넣으면 추가 배송비가 붙어요.</p>
        {blocked ? (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">주문할 수 없는 상품을 먼저 정리해 주세요.</p>
        ) : (
          <Link to="/checkout" className={buttonClass('primary', 'mt-6 w-full')}>
            주문하기
          </Link>
        )}
      </OrderSummaryBox>
    </div>
  )
}
