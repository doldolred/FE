import { Link, useParams } from 'react-router-dom'
import { ProductArt } from '../components/lineup/Art'
import { MoreFromDoldol, Points, Stage } from '../components/lineup/Stage'
import { MAIN_PRODUCT_ID, upcomingBySlug } from '../data/lineup'
import NotFoundPage from './NotFoundPage'

/** 출시 예정 제품 미리 보기 (v4-product 의 COMING SOON) — 서버에 아직 없는 제품이라 data/lineup.ts 에서 읽는다 */
export default function ComingSoonPage() {
  const product = upcomingBySlug(useParams().slug)
  if (!product) return <NotFoundPage />

  return (
    <div>
      <section className="grid items-center gap-[clamp(24px,5vw,72px)] md:grid-cols-[1.05fr_1fr]">
        <Stage badge="출시 예정" word={product.en}>
          <div className="art" data-art={product.art}>
            <ProductArt kind={product.art} />
          </div>
        </Stage>

        <div className="dd-info">
          <p className="text-sm font-black tracking-[0.1em] text-[#e4002b] italic">DOLDOL · {product.en}</p>
          <h1 className="mt-2.5 text-[clamp(38px,5vw,64px)] leading-[1.05] font-black tracking-[-0.03em]">{product.name}</h1>
          <p className="mt-2.5 font-extrabold text-neutral-500">{product.spec}</p>
          <p className="mt-5 max-w-[40ch] text-[clamp(15px,1.3vw,17px)] leading-[1.75]">{product.desc}</p>
          <Points items={product.points} />
          <div className="mt-8 border-t-2 border-dashed border-neutral-900 pt-7">
            <p className="dd-display text-[clamp(34px,3.4vw,48px)]">Coming soon</p>
            <p className="mt-3 text-sm text-neutral-600">출시되면 이 페이지에서 가장 먼저 알려 드릴게요.</p>
            <Link to={`/products/${MAIN_PRODUCT_ID}`} className="dd-btn mt-6" data-primary="">
              지금 파는 레드비트즙 보기
            </Link>
          </div>
        </div>
      </section>

      <MoreFromDoldol exceptSlug={product.slug} />
    </div>
  )
}
