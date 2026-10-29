import { PRODUCT_FAQ, PRODUCT_GUIDE, type Faq } from '../../data/productInfo'

/** 상품 상세 아래 "섭취방법 및 유의사항" — 고객 자료의 표를 그대로 (왼쪽 제목 · 오른쪽 항목) */
export function ProductGuide() {
  return (
    <section className="dd-guide" aria-labelledby="guide-title">
      <div className="inner">
        <h2 id="guide-title">섭취방법 및 유의사항</h2>
        <dl>
          {PRODUCT_GUIDE.map((row) => (
            <div key={row.title} className="row">
              <dt>{row.title}</dt>
              <dd>
                <ul>
                  {row.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {row.numbered && (
                  <ol>
                    {row.numbered.map((n) => (
                      <li key={n.title}>
                        {n.title}
                        <small>{n.note}</small>
                      </li>
                    ))}
                  </ol>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** 자주 묻는 질문 — 누르면 펼쳐진다 */
export function FaqList({ items, title = '자주 묻는 질문' }: { items?: Faq[]; title?: string }) {
  return (
    <section className="dd-faq" aria-label={title}>
      <div className="inner">
        <h2>{title}</h2>
        <div className="list">
          {(items ?? PRODUCT_FAQ).map((f) => (
            <details key={f.q}>
              <summary>
                <span className="q">Q</span>
                {f.q}
              </summary>
              <div className="a">
                {f.a.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
