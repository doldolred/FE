const YEAR = new Date().getFullYear()

export default function Footer({ dark = false }: { dark?: boolean }) {
  return (
    <footer className={dark ? 'border-t border-cream/10 bg-ink' : 'mt-20 border-t border-neutral-200 bg-neutral-50'}>
      <div className={`mx-auto max-w-6xl space-y-1 px-4 py-10 text-xs leading-relaxed ${dark ? 'text-cream/40' : 'text-neutral-500'}`}>
        <p className={`mb-3 text-sm font-bold ${dark ? 'text-cream/80' : 'text-neutral-700'}`}>돌돌 비트즙</p>
        {/* TODO: 전자상거래법상 필수 표시 사항 — 사업자 등록 후 채우기 */}
        <p>상호: (추후 기입) · 대표: (추후 기입) · 사업자등록번호: (추후 기입)</p>
        <p>통신판매업 신고번호: (추후 기입) · 주소: (추후 기입)</p>
        <p>고객센터: (추후 기입) · 이메일: (추후 기입)</p>
        <p className="pt-3">© {YEAR} DolDol. All rights reserved.</p>
      </div>
    </footer>
  )
}
