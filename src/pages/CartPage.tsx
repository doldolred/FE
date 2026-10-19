import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchCart, removeCartItem, updateCartItem } from '../api/cart'
import { queryKeys } from '../api/queryKeys'
import ProductImage from '../components/product/ProductImage'
import { buttonClass } from '../components/ui/buttonStyles'
import OrderSummaryBox from '../components/order/OrderSummaryBox'
import QuantityStepper from '../components/ui/QuantityStepper'
import { Empty, ErrorMessage, Loading } from '../components/ui/Status'
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
              <Link to={`/products/${item.productId}`} className="w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductImage src={item.imageUrl} alt={item.productName} className="text-sm" />
              </Link>
              <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <Link to={`/products/${item.productId}`} className="font-medium hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-sm text-neutral-500">{formatPrice(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <QuantityStepper
                    value={item.quantity}
                    disabled={busy}
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

      <OrderSummaryBox totalPrice={cart.totalPrice}>
        <Link to="/checkout" className={buttonClass('primary', 'mt-6 w-full')}>
          주문하기
        </Link>
      </OrderSummaryBox>
    </div>
  )
}
