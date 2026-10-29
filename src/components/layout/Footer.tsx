import { Link } from 'react-router-dom'
import { BUSINESS_INFO_URL, COMPANY } from '../../data/company'

const YEAR = new Date().getFullYear()

/** 전자상거래법상 필수 표시 사항 (상호 · 대표 · 사업자번호 · 통신판매업 · 주소 · 연락처 · 개인정보 책임자) */
export default function Footer({ dark = false }: { dark?: boolean }) {
  const link = dark ? 'text-cream/70 hover:text-cream' : 'text-neutral-700 hover:text-neutral-900'
  return (
    <footer className={dark ? 'bg-[#161415]' : 'mt-20 border-t border-neutral-200 bg-neutral-50'}>
      <div className={`mx-auto max-w-6xl space-y-1 px-4 py-10 text-xs leading-relaxed ${dark ? 'text-cream/40' : 'text-neutral-500'}`}>
        <nav className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link to="/notices" className={link}>
            공지사항
          </Link>
          <Link to="/faq" className={link}>
            자주 묻는 질문
          </Link>
          <Link to="/mypage/inquiries" className={link}>
            1:1 문의
          </Link>
          <Link to="/terms" className={link}>
            이용약관
          </Link>
          <Link to="/privacy" className={`font-bold ${link}`}>
            개인정보처리방침
          </Link>
          <Link to="/cookies" className={link}>
            쿠키 정책
          </Link>
          <Link to="/refund-policy" className={link}>
            교환 · 반품 · 환불
          </Link>
          <a href={BUSINESS_INFO_URL} target="_blank" rel="noreferrer" className={link}>
            사업자정보 확인
          </a>
        </nav>
        <p className={`mb-3 text-sm font-bold ${dark ? 'text-cream/80' : 'text-neutral-700'}`}>{COMPANY.storeName}</p>
        <p>
          상호: {COMPANY.name} ({COMPANY.bizType}) · 대표: {COMPANY.ceo} · 사업자등록번호: {COMPANY.businessNumber}
        </p>
        <p>
          통신판매업 신고번호: {COMPANY.mailOrderNumber} · 주소: {COMPANY.address}
        </p>
        <p>
          고객센터: {COMPANY.csPhone} ({COMPANY.csHours}) · 이메일: {COMPANY.privacyEmail}
        </p>
        <p>
          개인정보 보호책임자: {COMPANY.privacyOfficer} ({COMPANY.privacyEmail})
        </p>
        <p className="pt-3">© {YEAR} DolDol. All rights reserved.</p>
      </div>
    </footer>
  )
}
