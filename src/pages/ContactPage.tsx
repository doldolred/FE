import { Link } from 'react-router-dom'
import { FaqList } from '../components/product/ProductGuide'
import PageHead from '../components/store/PageHead'
import { buttonClass } from '../components/ui/buttonStyles'
import { COMPANY } from '../data/company'
import { ORDER_FAQ } from '../data/productInfo'
import { useIsLoggedIn } from '../stores/authStore'

/**
 * /contact — 고객센터 (로그인 없이 볼 수 있음).
 * 1:1 문의 · 교환/반품은 주문과 묶여야 해서 로그인 뒤 마이페이지로 보낸다 (안 했으면 로그인 화면을 거친다).
 */
export default function ContactPage() {
  const loggedIn = useIsLoggedIn()
  return (
    <div className="space-y-10">
      <PageHead kicker="CONTACT" title="문의하기" sub="궁금한 점은 1:1 문의나 전화로 남겨 주세요. 영업일 기준 빠르게 답해 드려요." />

      <div className="grid gap-6 md:grid-cols-3">
        <section className="dd-box flex flex-col" data-tone="navy">
          <h2>1:1 문의</h2>
          <p className="flex-1 text-sm break-keep opacity-80">주문 · 배송 · 상품 무엇이든 글로 남기면 답변을 마이페이지에서 확인할 수 있어요.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/mypage/inquiries/new" className={buttonClass('lime')}>
              문의 남기기
            </Link>
            {loggedIn && (
              <Link to="/mypage/inquiries" className="self-center text-sm font-bold underline underline-offset-4">
                내 문의 보기
              </Link>
            )}
          </div>
        </section>

        <section className="dd-box flex flex-col">
          <h2>전화 상담</h2>
          <a href={`tel:${COMPANY.csPhone.replaceAll('-', '')}`} className="dd-display text-3xl text-[#da1f2e] hover:underline">
            {COMPANY.csPhone}
          </a>
          <dl className="mt-3 flex-1 space-y-1 text-sm">
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-neutral-500">상담</dt>
              <dd className="font-bold">{COMPANY.csTime}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-neutral-500">점심</dt>
              <dd className="font-bold">{COMPANY.csLunch}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-14 shrink-0 text-neutral-500">휴무</dt>
              <dd className="font-bold">{COMPANY.csClosed}</dd>
            </div>
          </dl>
          <a href={`mailto:${COMPANY.privacyEmail}`} className="mt-4 text-sm font-bold break-all underline underline-offset-4">
            {COMPANY.privacyEmail}
          </a>
        </section>

        <section className="dd-box flex flex-col" data-tone="lime">
          <h2>교환 · 반품</h2>
          <p className="flex-1 text-sm break-keep">
            받은 날부터 7일 안에 주문 상세에서 신청해 주세요. 보내기 전에 꼭 먼저 접수해 주셔야 빠르게 처리돼요.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/mypage/orders" className={buttonClass('primary')}>
              주문 내역에서 신청
            </Link>
            <Link to="/refund-policy" className="self-center text-sm font-bold underline underline-offset-4">
              기준 보기
            </Link>
          </div>
        </section>
      </div>

      <section className="dd-box" data-tone="pink">
        <h2>반품 보내실 곳</h2>
        <p className="text-sm font-bold break-keep">{COMPANY.returnAddress}</p>
        <p className="mt-1 text-xs opacity-70">택배사: {COMPANY.courier} · 접수 없이 보내면 처리가 늦어질 수 있어요.</p>
      </section>

      <div>
        <div className="-mx-4 md:-mx-12">
          <FaqList items={ORDER_FAQ} title="많이 묻는 질문" />
        </div>
        <Link to="/faq" className="mt-4 inline-block text-sm font-bold underline underline-offset-4">
          자주 묻는 질문 전체 보기 →
        </Link>
      </div>
    </div>
  )
}
