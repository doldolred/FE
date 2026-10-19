import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { addCartItem } from '../api/cart'
import { fetchProduct } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import ProductImage from '../components/product/ProductImage'
import Button from '../components/ui/Button'
import QuantityStepper from '../components/ui/QuantityStepper'
import { ErrorMessage, Loading } from '../components/ui/Status'
import { formatPrice } from '../lib/format'
import { useIsLoggedIn } from '../stores/authStore'

export default function ProductDetailPage() {
  const id = Number(useParams().id)
  const loggedIn = useIsLoggedIn()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const { data: product, isPending, error } = useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => fetchProduct(id),
    enabled: Number.isInteger(id),
  })

  const addMutation = useMutation({
    mutationFn: () => addCartItem({ productId: id, quantity }),
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart, cart),
  })

  if (!Number.isInteger(id)) return <ErrorMessage error={new Error('잘못된 상품 주소입니다.')} />
  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />

  const soldOut = product.stock === 0

  const handleAdd = async (goCheckout: boolean) => {
    if (!loggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
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

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <ProductImage src={product.imageUrl} alt={product.name} className="rounded-2xl" />

      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-3 text-2xl font-extrabold text-beet-800">{formatPrice(product.price)}</p>
        {product.description && <p className="mt-6 whitespace-pre-line text-neutral-600">{product.description}</p>}

        <dl className="mt-8 space-y-3 border-y border-neutral-200 py-6 text-sm">
          <div className="flex">
            <dt className="w-20 text-neutral-500">배송</dt>
            <dd>무료배송</dd>
          </div>
          <div className="flex items-center">
            <dt className="w-20 text-neutral-500">수량</dt>
            <dd>
              <QuantityStepper
                value={quantity}
                onChange={(v) => {
                  setQuantity(v)
                  setAdded(false)
                }}
                max={Math.max(1, product.stock)}
                disabled={soldOut}
              />
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-neutral-500">총 상품금액</span>
          <span className="text-xl font-bold">{formatPrice(product.price * quantity)}</span>
        </div>

        {addMutation.error && (
          <div className="mt-4">
            <ErrorMessage error={addMutation.error} />
          </div>
        )}
        {added && (
          <p className="mt-4 rounded-lg bg-beet-50 px-4 py-3 text-sm text-beet-800">
            장바구니에 담았어요.{' '}
            <Link to="/cart" className="font-semibold underline">
              장바구니 보기
            </Link>
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(false)}>
            장바구니
          </Button>
          <Button disabled={soldOut || addMutation.isPending} onClick={() => handleAdd(true)}>
            {soldOut ? '품절' : '바로 구매'}
          </Button>
        </div>
      </div>
    </div>
  )
}
