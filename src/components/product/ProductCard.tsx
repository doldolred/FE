import { Link } from 'react-router-dom'
import type { Product } from '../../api/types'
import { formatPrice } from '../../lib/format'
import ProductImage from './ProductImage'

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.soldOut
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded bg-neutral-900/80 px-2 py-1 text-xs font-semibold text-white">
            품절
          </span>
        )}
      </div>
      <h3 className="mt-3 font-medium text-neutral-900">{product.name}</h3>
      <p className="mt-1 font-bold text-beet-800">{formatPrice(product.minPrice)}~</p>
    </Link>
  )
}
