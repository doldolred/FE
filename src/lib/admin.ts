/** 한국 날짜 YYYY-MM-DD (n 일 전) */
export function kstDate(daysAgo = 0) {
  const d = new Date(Date.now() + 9 * 3600_000 - daysAgo * 86400_000)
  return d.toISOString().slice(0, 10)
}

export const inputClass =
  'rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-beet-600 focus:ring-2 focus:ring-beet-100'
