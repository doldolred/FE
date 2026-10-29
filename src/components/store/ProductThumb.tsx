import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { fetchProducts } from '../../api/products'
import { queryKeys } from '../../api/queryKeys'
import type { Product } from '../../api/types'
import { artKind, themeColors } from '../../data/lineup'
import { ProductFigure } from '../lineup/Stage'

/**
 * 정사각 상품 그림 — 관리자가 올린 대표 사진이 있으면 사진, 없으면 라인업 그림(파우치 도안 · 병)을 제품 색 판 위에.
 * product 를 모르면(장바구니 · 주문 줄) id 로 /api/products 에서 찾는다.
 */
export default function ProductThumb({
  productId,
  imageUrl,
  name,
  product,
  className = '',
}: {
  productId: number
  imageUrl?: string | null
  name: string
  product?: Product
  className?: string
}) {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts, enabled: !product })
  const p = product ?? products?.find((x) => x.id === productId)
  const src = imageUrl ?? p?.imageUrl ?? null
  const style = { '--c-stage': themeColors(p?.theme).stage } as CSSProperties

  return (
    <div className={`dd-thumb ${className}`} style={style} data-art={p ? artKind(p.art) : undefined} role="img" aria-label={name}>
      {src ? <img src={src} alt="" /> : p ? <ProductFigure product={p} /> : <span className="dd-kicker text-sm">DOLDOL</span>}
    </div>
  )
}
