import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api/products'
import { queryKeys } from '../api/queryKeys'
import type { Product } from '../api/types'
import { MoreFromDoldol, Points, ProductFigure, ProductPage, SpinPouch, Stage } from '../components/lineup/Stage'
import { artKind, mainProductOf, shortName, themeColors } from '../data/lineup'

/**
 * 출시 예정 제품 미리 보기 (v4-product 의 COMING SOON) — /products/:id 가 출시 예정 상품이면 이 화면.
 * 무엇을 보여 줄지는 관리자 상품 화면(상태 · 라인업 항목)에서 정한다.
 * 원본의 "출시 알림 받기"(이메일 입력)는 받아 둘 곳이 아직 없어서 넣지 않았다.
 */
export default function ComingSoonPage({ product }: { product: Product }) {
  const { data: products } = useQuery({ queryKey: queryKeys.products, queryFn: fetchProducts })
  const main = mainProductOf(products)
  const kind = artKind(product.art)

  return (
    <ProductPage colors={themeColors(product.theme)}>
      <section className="dd-hero">
        <Stage badge="출시 예정" word={product.enName ?? shortName(product.name)}>
          {kind === 'pouch' ? (
            <SpinPouch label={product.name} front={product.artFrontUrl} back={product.artBackUrl} />
          ) : (
            <div className="art" data-art={kind}>
              <ProductFigure product={product} />
            </div>
          )}
        </Stage>

        <div className="dd-info">
          {product.enName && <p className="en dd-kicker">DOLDOL · {product.enName}</p>}
          <h1>{product.name}</h1>
          {product.spec && <p className="spec">{product.spec}</p>}
          {product.description && <p className="desc">{product.description}</p>}
          {product.points.length > 0 && <Points items={product.points} />}
          <div className="dd-buy">
            <span className="price">COMING SOON</span>
            <p className="mt-3 text-sm opacity-70">출시되면 이 페이지에서 가장 먼저 알려 드릴게요.</p>
            {main && (
              <Link to={`/products/${main.id}`} className="dd-btn mt-5" data-primary="">
                지금 파는 제품 보기
              </Link>
            )}
          </div>
        </div>
      </section>

      <MoreFromDoldol exceptProductId={product.id} />
    </ProductPage>
  )
}
