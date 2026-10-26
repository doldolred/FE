import { EFFECTIVE_DATE, PRIVACY, TERMS, type LegalSection } from '../data/legal'

const DOCS: Record<'terms' | 'privacy', { title: string; sections: LegalSection[] }> = {
  terms: { title: '이용약관', sections: TERMS },
  privacy: { title: '개인정보처리방침', sections: PRIVACY },
}

/** /terms · /privacy — 문구는 data/legal.ts */
export default function LegalPage({ doc }: { doc: 'terms' | 'privacy' }) {
  const { title, sections } = DOCS[doc]
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">시행일 {EFFECTIVE_DATE}</p>
      <div className="mt-10 space-y-8 text-sm leading-relaxed text-neutral-700">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="mb-2 font-bold text-neutral-900">{s.title}</h2>
            <LegalBody lines={s.body} />
          </section>
        ))}
      </div>
    </article>
  )
}

/** '- ' 로 시작하는 줄은 목록으로 묶는다 */
function LegalBody({ lines }: { lines: string[] }) {
  const blocks: (string | string[])[] = []
  for (const line of lines) {
    if (line.startsWith('- ')) {
      const last = blocks.at(-1)
      if (Array.isArray(last)) last.push(line.slice(2))
      else blocks.push([line.slice(2)])
    } else blocks.push(line)
  }
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        Array.isArray(b) ? (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b}</p>
        ),
      )}
    </div>
  )
}
