import { Link } from 'react-router-dom'
import { FaqList } from '../components/product/ProductGuide'
import { COMPANY } from '../data/company'
import { ORDER_FAQ, PRODUCT_FAQ } from '../data/productInfo'
import PageHead from '../components/store/PageHead'

/** /faq — 자주 묻는 질문 (상품 · 주문/배송/교환) */
export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHead kicker="FAQ" title="자주 묻는 질문" />
      <div className="-mx-4 md:-mx-12">
        <FaqList items={PRODUCT_FAQ} title="상품" />
        <FaqList items={ORDER_FAQ} title="주문 · 배송 · 교환" />
      </div>
      <p className="mt-6 text-sm text-neutral-600">
        찾는 답이 없으면{' '}
        <Link to="/mypage/inquiries/new" className="font-semibold underline">
          1:1 문의
        </Link>
        를 남기거나 고객센터({COMPANY.csPhone}, {COMPANY.csHours})로 연락해 주세요.{' '}
        <Link to="/contact" className="font-semibold underline">
          문의하기 안내
        </Link>
      </p>
    </div>
  )
}
