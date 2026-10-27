import { Link, useParams } from 'react-router-dom'
import { ProductArt } from '../components/lineup/Art'
import { MoreFromDoldol, Points, ProductPage, Stage } from '../components/lineup/Stage'
import { MAIN_PRODUCT_ID, upcomingBySlug } from '../data/lineup'
import NotFoundPage from './NotFoundPage'

/**
 * 출시 예정 제품 미리 보기 (v4-product 의 COMING SOON) — 서버에 아직 없는 제품이라 data/lineup.ts 에서 읽는다.
 * 원본의 "출시 알림 받기"(이메일 입력)는 받아 둘 곳이 아직 없어서 넣지 않았다.
 */
export default function ComingSoonPage() {
  const product = upcomingBySlug(useParams().slug)
  if (!product) return <NotFoundPage />

  return (
    <ProductPage colors={product}>
      <section className="dd-hero">
        <Stage badge="출시 예정" word={product.en}>
          <div className="art" data-art={product.art}>
            <ProductArt kind={product.art} />
          </div>
        </Stage>

        <div className="dd-info">
          <p className="en dd-kicker">DOLDOL · {product.en}</p>
          <h1>{product.name}</h1>
          <p className="spec">{product.spec}</p>
          <p className="desc">{product.desc}</p>
          <Points items={product.points} />
          <div className="dd-buy">
            <span className="price">COMING SOON</span>
            <p className="mt-3 text-sm opacity-70">출시되면 이 페이지에서 가장 먼저 알려 드릴게요.</p>
            <Link to={`/products/${MAIN_PRODUCT_ID}`} className="dd-btn mt-5" data-primary="">
              지금 파는 레드비트즙 보기
            </Link>
          </div>
        </div>
      </section>

      <MoreFromDoldol exceptSlug={product.slug} />
    </ProductPage>
  )
}
