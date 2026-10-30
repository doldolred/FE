import { Link } from 'react-router-dom'
import PageHead from '../components/store/PageHead'
import { buttonClass } from '../components/ui/buttonStyles'
import { COMPANY } from '../data/company'

/** 돌돌이 지키는 것 — 메인 섹션 문구와 같은 사실만 (효능 · 건강 주장은 넣지 않는다, 식품) */
const PROMISES = [
  { big: '100%', title: '비트만', text: '제주산 비트를 통째로 씻어 착즙했어요. 다른 과일이나 채소를 섞지 않았어요.' },
  { big: '0%', title: '물도 설탕도 없이', text: '물로 늘리거나 단맛을 더하지 않았어요. 비트 본연의 맛 그대로예요.' },
  { big: '120ml', title: '한 포씩', text: '뜯어서 바로 마시는 파우치 한 포. 챙기기 쉬워 매일 이어 가기 좋아요.' },
]

const STEPS = [
  { no: '01', title: '고르기', text: '제주에서 자란 비트를 골라요.' },
  { no: '02', title: '씻기', text: '껍질째 깨끗이 씻어요.' },
  { no: '03', title: '착즙', text: '물 없이 비트만 착즙해요.' },
  { no: '04', title: '담기', text: '120ml 파우치에 한 포씩 담아요.' },
]

/** /about — 회사 소개 */
export default function AboutPage() {
  return (
    <div className="space-y-12">
      <PageHead kicker="ABOUT" title="매일 가볍게 채우는 건강" sub="돌돌은 제주 비트 하나로 만드는 레드비트즙 브랜드예요." />

      <section className="dd-box" data-tone="navy">
        <p className="dd-display text-[clamp(44px,9vw,110px)] leading-[0.9] text-[#da1f2e]">UNBEETABLE</p>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed break-keep">
          좋은 습관은 어렵지 않아야 오래 갑니다. 돌돌은 아침에 한 포, 가방에 한 포 — 뜯어서 바로 마시는 비트즙으로 매일의 습관을 가볍게
          만들고 싶었어요. 그래서 재료는 비트 하나, 방법은 착즙 하나로 정했습니다.
        </p>
      </section>

      <section aria-label="돌돌이 지키는 것">
        <h2 className="dd-display-ko mb-5 text-2xl">돌돌이 지키는 세 가지</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PROMISES.map((p, i) => (
            <article key={p.title} className="dd-box" data-tone={i === 1 ? 'lime' : undefined}>
              <p className="dd-display text-5xl text-[#da1f2e]">{p.big}</p>
              <h3 className="mt-3 text-lg font-black">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed break-keep opacity-80">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dd-box" data-tone="pink" aria-label="만드는 과정">
        <h2>이렇게 만들어요</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.no} className="rounded-2xl border-2 border-[#222021] bg-white p-4">
              <span className="dd-display text-3xl text-[#da1f2e]">{s.no}</span>
              <b className="mt-1 block font-black">{s.title}</b>
              <span className="mt-1 block text-sm opacity-75">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <section className="dd-box" aria-label="회사 정보">
          <h2>회사 정보</h2>
          <dl className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-neutral-500">상호</dt>
            <dd className="font-bold">{COMPANY.name}</dd>
            <dt className="text-neutral-500">대표</dt>
            <dd className="font-bold">{COMPANY.ceo}</dd>
            <dt className="text-neutral-500">주소</dt>
            <dd className="font-bold break-keep">{COMPANY.address}</dd>
            <dt className="text-neutral-500">고객센터</dt>
            <dd className="font-bold">
              {COMPANY.csPhone} · {COMPANY.csTime}
            </dd>
            <dt className="text-neutral-500">이메일</dt>
            <dd className="font-bold break-all">{COMPANY.privacyEmail}</dd>
          </dl>
        </section>
        <section className="dd-box flex flex-col justify-between gap-6" data-tone="lime">
          <div>
            <h2>한 포로 시작해 보세요</h2>
            <p className="text-sm break-keep">5만원 이상 무료배송 · 평일 오후 3시 이전 결제 건은 당일 발송해요.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/products" className={buttonClass('primary')}>
              제품 보기
            </Link>
            <Link to="/contact" className={buttonClass('secondary')}>
              문의하기
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
