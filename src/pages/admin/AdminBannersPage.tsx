import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { createBanner, deleteBanner, fetchAdminBanners, updateBanner } from '../../api/admin'
import type { Banner, BannerRequest, BannerTheme } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { BannerStrip } from '../../components/layout/TopBanner'
import Button from '../../components/ui/Button'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { formatDate } from '../../lib/format'

const KEY = ['admin', 'banners'] as const

const THEMES: { value: BannerTheme; label: string; swatch: string }[] = [
  { value: 'RED', label: '빨강', swatch: 'bg-[#e4002b]' },
  { value: 'BLACK', label: '검정', swatch: 'bg-neutral-950' },
  { value: 'WHITE', label: '흰색', swatch: 'bg-white border border-neutral-300' },
]

const EMPTY: BannerRequest = { message: '', linkUrl: '', theme: 'RED', startsAt: null, endsAt: null, active: true, sortOrder: 0 }

/** ISO → <input type="datetime-local"> 값 (이 컴퓨터 시간대, 분까지) */
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

type State = { label: string; className: string }

/** 지금 손님에게 보이는지 — 서버 규칙(켜짐 + 기간 안)과 같다 */
function stateOf(b: Pick<Banner, 'active' | 'startsAt' | 'endsAt'>, now: number): State {
  if (!b.active) return { label: '꺼짐', className: 'text-neutral-400' }
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return { label: '예약', className: 'text-sky-700' }
  if (b.endsAt && new Date(b.endsAt).getTime() <= now) return { label: '끝남', className: 'text-neutral-400' }
  return { label: '노출 중', className: 'text-emerald-700' }
}

/** 띠배너 — 쇼핑몰 맨 위 한 줄. 여러 개 켜 두면 순서대로 돌아가며 보인다 */
export default function AdminBannersPage() {
  const [editing, setEditing] = useState<Banner | 'new' | null>(null)
  const [now] = useState(() => Date.now())
  const { data, isPending, error } = useQuery({ queryKey: KEY, queryFn: fetchAdminBanners })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">띠배너</h1>
          <p className="mt-1 text-sm text-neutral-500">
            쇼핑몰 맨 위 한 줄 문구예요. 켜져 있고 기간 안인 것만 순서대로 4.5초씩 돌아가며 보여요.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>새 띠배너</Button>
      </div>

      {editing && (
        <BannerForm
          key={editing === 'new' ? 'new' : editing.id}
          banner={editing === 'new' ? null : editing}
          nextOrder={(data?.reduce((m, b) => Math.max(m, b.sortOrder), -1) ?? -1) + 1}
          onDone={() => setEditing(null)}
        />
      )}

      <Panel title="전체">
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">띠배너가 없어요. 없으면 쇼핑몰 맨 위에 아무것도 안 나와요.</p>
        ) : (
          <ul className="space-y-3">
            {data.map((b) => {
              const st = stateOf(b, now)
              return (
                <li key={b.id} className="overflow-hidden rounded-xl border border-neutral-200">
                  <div className={b.active ? '' : 'opacity-40'}>
                    <BannerStrip message={b.message} linkUrl={b.linkUrl} theme={b.theme} preview />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-neutral-500">
                    <span className={`font-bold ${st.className}`}>{st.label}</span>
                    <span>순서 {b.sortOrder}</span>
                    <span>{b.startsAt || b.endsAt ? `${b.startsAt ? formatDate(b.startsAt) : '처음부터'} ~ ${b.endsAt ? formatDate(b.endsAt) : '계속'}` : '기간 없음'}</span>
                    {b.linkUrl && <span className="truncate">→ {b.linkUrl}</span>}
                    <button type="button" className="ml-auto font-semibold text-neutral-700 hover:underline" onClick={() => setEditing(b)}>
                      고치기
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function BannerForm({ banner, nextOrder, onDone }: { banner: Banner | null; nextOrder: number; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [now] = useState(() => Date.now())
  const [form, setForm] = useState<BannerRequest>(
    banner
      ? { message: banner.message, linkUrl: banner.linkUrl ?? '', theme: banner.theme, startsAt: banner.startsAt, endsAt: banner.endsAt, active: banner.active, sortOrder: banner.sortOrder }
      : { ...EMPTY, sortOrder: nextOrder },
  )
  const set = (patch: Partial<BannerRequest>) => setForm((f) => ({ ...f, ...patch }))

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: KEY })
    queryClient.invalidateQueries({ queryKey: ['banners'] })
  }
  const save = useMutation({
    mutationFn: () => {
      const req = { ...form, linkUrl: form.linkUrl?.trim() || null }
      return banner ? updateBanner(banner.id, req) : createBanner(req)
    },
    onSuccess: () => {
      refresh()
      onDone()
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteBanner(banner!.id),
    onSuccess: () => {
      refresh()
      onDone()
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  const st = stateOf(form, now)

  return (
    <Panel title={banner ? '띠배너 고치기' : '새 띠배너'}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium">
              문구 <span className="font-normal text-neutral-400 tabular-nums">{form.message.length} / 80</span>
            </span>
            <input
              className={`${inputClass} w-full`}
              required
              maxLength={80}
              value={form.message}
              onChange={(e) => set({ message: e.target.value })}
              placeholder="예: 5만원 이상 구매 시 무료배송"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">링크 (선택)</span>
            <input
              className={`${inputClass} w-full`}
              maxLength={300}
              pattern="\s*(/(?!/)\S*|https://\S+)?\s*"
              title="/로 시작하는 사이트 안 경로나 https:// 주소"
              value={form.linkUrl ?? ''}
              onChange={(e) => set({ linkUrl: e.target.value })}
              placeholder="/products/1 또는 https://…"
            />
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">색</legend>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <label
                  key={t.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${form.theme === t.value ? 'border-neutral-900 font-semibold' : 'border-neutral-300'}`}
                >
                  <input type="radio" name="theme" className="sr-only" checked={form.theme === t.value} onChange={() => set({ theme: t.value })} />
                  <span className={`h-4 w-4 rounded-full ${t.swatch}`} aria-hidden="true" />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">시작 (비우면 바로)</span>
              <input type="datetime-local" className={`${inputClass} w-full`} value={toLocalInput(form.startsAt)} onChange={(e) => set({ startsAt: fromLocalInput(e.target.value) })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">끝 (비우면 계속)</span>
              <input type="datetime-local" className={`${inputClass} w-full`} value={toLocalInput(form.endsAt)} onChange={(e) => set({ endsAt: fromLocalInput(e.target.value) })} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
              켜기
            </label>
            <label className="flex items-center gap-2">
              순서
              <input
                type="number"
                min={0}
                max={999}
                required
                className={`${inputClass} w-20`}
                value={form.sortOrder}
                onChange={(e) => set({ sortOrder: Number(e.target.value) })}
              />
              <span className="text-xs text-neutral-400">작을수록 먼저</span>
            </label>
          </div>

          {save.error && <ErrorMessage error={save.error} />}
          {remove.error && <ErrorMessage error={remove.error} />}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={save.isPending}>
              {banner ? '저장' : '등록'}
            </Button>
            <Button variant="secondary" onClick={onDone}>
              취소
            </Button>
            {banner && (
              <Button
                variant="ghost"
                className="ml-auto text-red-600 hover:bg-red-50"
                disabled={remove.isPending}
                onClick={() => window.confirm('이 띠배너를 지울까요?') && remove.mutate()}
              >
                삭제
              </Button>
            )}
          </div>
        </form>

        <div>
          <p className="mb-2 text-sm font-medium">
            미리보기 <span className={`ml-2 text-xs font-bold ${st.className}`}>저장하면: {st.label}</span>
          </p>
          <PreviewFrame>
            <BannerStrip message={form.message.trim() || '문구를 입력하세요'} linkUrl={form.linkUrl?.trim() || null} theme={form.theme} preview />
          </PreviewFrame>
          <p className="mt-3 text-xs text-neutral-500">휴대폰처럼 좁은 화면에서는 긴 문구가 … 으로 잘려요. 짧을수록 좋아요.</p>
          <div className="mt-2 w-[320px] max-w-full">
            <PreviewFrame small>
              <BannerStrip message={form.message.trim() || '문구를 입력하세요'} linkUrl={form.linkUrl?.trim() || null} theme={form.theme} preview />
            </PreviewFrame>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/** 쇼핑몰 맨 위를 흉내 낸 틀 — 띠배너 + 헤더(로고) + 흰 바탕 */
function PreviewFrame({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <div className="pointer-events-none overflow-hidden rounded-xl border border-neutral-300 bg-white select-none" aria-hidden="true">
      {children}
      <div className="grid h-[52px] grid-cols-[1fr_auto_1fr] items-center border-b-2 border-neutral-900 px-4 text-[10px] font-extrabold tracking-[0.12em]">
        <span className={small ? 'invisible' : ''}>LINEUP · ABOUT · SHOP</span>
        <span className="dd-logo !text-base">
          DOL<em className="text-[#e4002b] not-italic">DOL</em>
        </span>
        <span className="text-right">장바구니 · 로그인</span>
      </div>
      <div className={small ? 'h-16' : 'h-24'} />
    </div>
  )
}
