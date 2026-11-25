import { INSTAGRAM } from '../../data/company'

/**
 * 메인의 인스타그램 구간 (1차 수정 요청) — 브랜드 분위기를 보여 주는 피드.
 * 게시물은 data/company.ts 의 INSTAGRAM.posts (그림 + 게시물 주소)에 넣는다.
 * 아직 계정 · 게시물이 없으면 브랜드 그림으로 자리만 잡아 두고 "연결 전"이라고 밝힌다 — 남의 게시물인 것처럼 보이지 않게.
 */
const PLACEHOLDERS = [
  { img: '/bg/jeju-sea-sm.webp', cut: false },
  { img: '/art/beet-whole.webp', cut: true },
  { img: '/bg/basalt-sm.webp', cut: false },
  { img: '/art/beet-half.webp', cut: true },
]

export default function InstagramFeed() {
  const live = INSTAGRAM.posts.length > 0
  return (
    <section className="dd-insta" data-tone="light" aria-label="인스타그램">
      <div className="inner">
        <header className="head">
          <div>
            <p className="eyebrow dd-kicker">INSTAGRAM</p>
            <h2>{INSTAGRAM.handle ? `@${INSTAGRAM.handle}` : '돌돌의 하루'}</h2>
          </div>
          {INSTAGRAM.url ? (
            <a className="more" href={INSTAGRAM.url} target="_blank" rel="noreferrer">
              인스타그램에서 보기 →
            </a>
          ) : (
            <span className="pending">계정 연결 전 — 임시 이미지예요</span>
          )}
        </header>
        <ul className="grid">
          {live
            ? INSTAGRAM.posts.map((p) => (
                <li key={p.url}>
                  <a href={p.url} target="_blank" rel="noreferrer" aria-label="인스타그램 게시물 보기">
                    <img src={p.img} alt="" loading="lazy" />
                  </a>
                </li>
              ))
            : PLACEHOLDERS.map((p) => (
                <li key={p.img} data-cut={p.cut ? '' : undefined}>
                  <img src={p.img} alt="" loading="lazy" />
                </li>
              ))}
        </ul>
      </div>
    </section>
  )
}
