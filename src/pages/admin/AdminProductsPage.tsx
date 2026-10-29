import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { changeProductStatus, createProduct, fetchAdminProduct, fetchAdminProducts, updateProduct, uploadImage } from '../../api/admin'
import type { AdminProduct, AdminProductRequest, LineupArt, LineupTheme, Product, ProductStatus } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { ProductFigure } from '../../components/lineup/Stage'
import { ART_LABELS, THEMES, artKind, themeColors } from '../../data/lineup'
import { inputClass } from '../../lib/admin'
import ProductImage from '../../components/product/ProductImage'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { Empty, ErrorMessage, Loading } from '../../components/ui/Status'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { formatPrice } from '../../lib/format'

const STATUS: Record<ProductStatus, { label: string; help: string; badge: string }> = {
  SELLING: { label: '판매중', help: '라인업 · 상세에 보이고 살 수 있어요. 판매할 옵션이 하나 이상 있어야 해요.', badge: 'bg-emerald-100 text-emerald-800' },
  COMING_SOON: { label: '출시 예정', help: '라인업 · 상세에 "출시 예정"으로 보이고, 살 수는 없어요. 옵션 없이도 돼요.', badge: 'bg-amber-100 text-amber-800' },
  HIDDEN: { label: '비공개', help: '손님 화면에서 사라져요. 지난 주문 · 후기는 그대로 남아요.', badge: 'bg-neutral-200 text-neutral-700' },
}
const STATUSES = Object.keys(STATUS) as ProductStatus[]

export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchAdminProducts })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProductStatus }) => changeProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품</h1>
        <Link to="/admin/products/new" className={buttonClass('primary')}>
          상품 등록
        </Link>
      </div>
      <p className="text-sm text-neutral-500">
        라인업 순서대로 보여요. 메인 첫 화면 가운데는 맨 앞 <b>판매중</b> 상품, 양옆은 나머지 판매중 · 출시 예정 상품이에요.
      </p>
      {statusMutation.error && <ErrorMessage error={statusMutation.error} />}
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data.length === 0 ? (
        <Empty>등록된 상품이 없어요.</Empty>
      ) : (
        <div className="grid gap-4">
          {data.map((p) => (
            <Panel key={p.id}>
              <div className="flex flex-wrap items-start gap-4">
                <span className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200" style={swatch(p.theme)} title={THEMES[p.theme].label} aria-hidden="true">
                  <span className="grid h-full place-items-center text-[10px] font-bold" style={{ color: THEMES[p.theme].dark ? '#fff' : '#16173d' }}>
                    {p.lineupOrder}번
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {p.name}
                    <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${STATUS[p.status].badge}`}>{STATUS[p.status].label}</span>
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {[p.enName, p.spec, ART_LABELS[p.art], p.artFrontUrl ? '파우치 도안 있음' : null].filter(Boolean).join(' · ')}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                    {p.options.map((o) => (
                      <li key={o.id} className={`rounded-full border px-3 py-1 ${o.active ? 'border-neutral-300' : 'border-dashed border-neutral-300 text-neutral-400'}`}>
                        {o.name} · {formatPrice(o.price)} · 재고 <b className={o.stock === 0 ? 'text-red-600' : ''}>{o.stock}</b>
                        {!o.active && ' · 중지'}
                      </li>
                    ))}
                    {p.options.length === 0 && <li className="text-neutral-400">옵션 없음</li>}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${p.id}`}>
                    {p.name} 상태
                  </label>
                  <select
                    id={`status-${p.id}`}
                    className={inputClass}
                    value={p.status}
                    disabled={statusMutation.isPending}
                    onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value as ProductStatus })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </select>
                  {p.status !== 'HIDDEN' && (
                    <Link to={`/products/${p.id}`} target="_blank" className={buttonClass('secondary')}>
                      손님 화면
                    </Link>
                  )}
                  <Link to={`/admin/products/${p.id}`} className={buttonClass('primary')}>
                    수정
                  </Link>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}

const swatch = (theme: LineupTheme): CSSProperties => {
  const c = THEMES[theme]
  return { background: `linear-gradient(135deg, ${c.bg} 0 55%, ${c.stage} 55% 100%)` }
}

type OptionForm = { id?: number; name: string; listPrice: string; price: string; stock: string; active: boolean }
const blankOption = (): OptionForm => ({ name: '', listPrice: '', price: '', stock: '0', active: true })

function toForm(p?: AdminProduct) {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    imageUrl: p?.imageUrl ?? '',
    status: p?.status ?? ('SELLING' as ProductStatus),
    // 판매중지된 옵션도 보여 줘서 다시 켤 수 있게
    options: p
      ? p.options.map((o) => ({ id: o.id, name: o.name, listPrice: String(o.listPrice), price: String(o.price), stock: String(o.stock), active: o.active }))
      : [blankOption()],
    enName: p?.enName ?? '',
    spec: p?.spec ?? '',
    points: (p?.points ?? []).join('\n'),
    theme: p?.theme ?? ('PINK' as LineupTheme),
    art: p?.art ?? ('POUCH' as LineupArt),
    artFrontUrl: p?.artFrontUrl ?? '',
    artBackUrl: p?.artBackUrl ?? '',
    lineupOrder: String(p?.lineupOrder ?? 10),
  }
}
type Form = ReturnType<typeof toForm>

/** /admin/products/new · /admin/products/:id — 상품 + 옵션(10포 · 30포 · 60포 …) + 라인업 항목 + 이미지 */
export function AdminProductEditPage() {
  const params = useParams()
  const isNew = params.id === 'new'
  const id = Number(params.id)
  const { data, isPending, error } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => fetchAdminProduct(id),
    enabled: !isNew,
  })
  if (isNew) return <ProductForm />
  if (isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  // 불러온 상품으로 폼을 처음부터 채운다 (key: 다른 상품으로 가면 새로)
  return <ProductForm key={data.id} product={data} />
}

const splitPoints = (text: string) =>
  text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)

function ProductForm({ product }: { product?: AdminProduct }) {
  const isNew = !product
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => toForm(product))
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<keyof Form | null>(null)

  const save = useMutation({
    mutationFn: () => {
      // 판매중이 아니면 이름도 안 적은 새 옵션 칸은 버린다 (출시 예정은 옵션 없이 등록)
      const options = form.status === 'SELLING' ? form.options : form.options.filter((o) => o.id || o.name.trim())
      const req: AdminProductRequest = {
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        status: form.status,
        options: options.map((o) => ({
          id: o.id,
          name: o.name,
          listPrice: Number(o.listPrice || o.price),
          price: Number(o.price),
          stock: Number(o.stock),
          active: o.active,
        })),
        enName: form.enName,
        spec: form.spec,
        points: splitPoints(form.points),
        theme: form.theme,
        art: form.art,
        artFrontUrl: form.art === 'POUCH' ? form.artFrontUrl : '',
        artBackUrl: form.art === 'POUCH' ? form.artBackUrl : '',
        lineupOrder: Number(form.lineupOrder || 0),
      }
      return product ? updateProduct(product.id, req) : createProduct(req)
    },
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
      queryClient.setQueryData(['admin', 'product', p.id], p)
      navigate('/admin/products')
    },
  })
  const fieldErrors = getFieldErrors(save.error)

  const setOption = (i: number, patch: Partial<OptionForm>) =>
    setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }))
  const moveOption = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const options = [...f.options]
      const j = i + dir
      if (j < 0 || j >= options.length) return f
      ;[options[i], options[j]] = [options[j], options[i]]
      return { ...f, options }
    })

  const handleFile = async (field: 'imageUrl' | 'artFrontUrl' | 'artBackUrl', file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    setUploading(field)
    try {
      const { url } = await uploadImage(file)
      setForm((f) => ({ ...f, [field]: url }))
    } catch (e) {
      setUploadError(getErrorMessage(e))
    } finally {
      setUploading(null)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  const pointCount = splitPoints(form.points).length
  // 미리 보기용 — 손님 화면 카드와 같은 모양
  const preview: Product = {
    id: product?.id ?? 0,
    name: form.name || '상품명',
    description: null,
    imageUrl: null,
    status: form.status === 'COMING_SOON' ? 'COMING_SOON' : 'SELLING',
    minPrice: 0,
    soldOut: false,
    options: [],
    enName: form.enName || null,
    spec: form.spec || null,
    points: splitPoints(form.points),
    theme: form.theme,
    art: form.art,
    artFrontUrl: form.art === 'POUCH' ? form.artFrontUrl || null : null,
    artBackUrl: form.art === 'POUCH' ? form.artBackUrl || null : null,
  }
  const colors = themeColors(form.theme)

  return (
    <form onSubmit={submit} className="space-y-6">
      <Link to="/admin/products" className="text-sm text-neutral-500 hover:underline">
        ← 상품 목록
      </Link>
      <h1 className="text-2xl font-bold">{isNew ? '상품 등록' : '상품 수정'}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Panel title="기본 정보">
            <div className="grid gap-4">
              <Field label="상품명" error={fieldErrors.name}>
                <input className={`${inputClass} w-full`} required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="설명" error={fieldErrors.description}>
                <textarea
                  className={`${inputClass} min-h-28 w-full`}
                  maxLength={2000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <fieldset>
                <legend className="mb-2 text-xs font-medium text-neutral-600">상태</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {STATUSES.map((s) => (
                    <label
                      key={s}
                      className={`cursor-pointer rounded-xl border p-3 text-sm ${form.status === s ? 'border-beet-700 bg-beet-50' : 'border-neutral-200 hover:bg-neutral-50'}`}
                    >
                      <span className="flex items-center gap-2 font-bold">
                        <input type="radio" name="status" className="accent-beet-700" checked={form.status === s} onChange={() => setForm({ ...form, status: s })} />
                        {STATUS[s].label}
                      </span>
                      <span className="mt-1 block text-xs text-neutral-500">{STATUS[s].help}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.status && <p className="mt-1 text-xs text-red-600">{fieldErrors.status}</p>}
              </fieldset>
            </div>
          </Panel>

          <Panel
            title="옵션"
            action={
              <Button variant="secondary" onClick={() => setForm((f) => ({ ...f, options: [...f.options, blankOption()] }))}>
                옵션 추가
              </Button>
            }
          >
            <p className="mb-3 text-xs text-neutral-500">
              순서대로 손님 화면에 나와요. 주문된 적 있는 옵션은 지울 수 없어서, 목록에서 빼면 판매중지로 남아요. 정상가를 비우면 판매가와 같게 저장돼요.
              {form.status !== 'SELLING' && ' 출시 예정 · 비공개 상품은 옵션 없이 저장할 수 있어요.'}
            </p>
            {fieldErrors.options && <p className="mb-2 text-xs text-red-600">{fieldErrors.options}</p>}
            {form.options.length === 0 && <p className="text-sm text-neutral-400">옵션이 없어요.</p>}
            <div className="space-y-3">
              {form.options.map((o, i) => (
                <div
                  key={o.id ?? `new-${i}`}
                  className={`grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] sm:items-end ${o.active ? 'border-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-50'}`}
                >
                  <Field label="이름 (예: 30포)" error={fieldErrors[`options[${i}].name`]}>
                    <input className={`${inputClass} w-full`} required maxLength={50} value={o.name} onChange={(e) => setOption(i, { name: e.target.value })} />
                  </Field>
                  <Field label="정상가" error={fieldErrors[`options[${i}].listPrice`]}>
                    <input className={`${inputClass} w-full`} type="number" min={0} value={o.listPrice} onChange={(e) => setOption(i, { listPrice: e.target.value })} />
                  </Field>
                  <Field label="판매가" error={fieldErrors[`options[${i}].price`]}>
                    <input className={`${inputClass} w-full`} type="number" min={0} required value={o.price} onChange={(e) => setOption(i, { price: e.target.value })} />
                  </Field>
                  <Field label="재고" error={fieldErrors[`options[${i}].stock`]}>
                    <input className={`${inputClass} w-full`} type="number" min={0} required value={o.stock} onChange={(e) => setOption(i, { stock: e.target.value })} />
                  </Field>
                  <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" className="accent-beet-700" checked={o.active} onChange={(e) => setOption(i, { active: e.target.checked })} />
                      판매
                    </label>
                    <IconButton label="위로" onClick={() => moveOption(i, -1)}>
                      ↑
                    </IconButton>
                    <IconButton label="아래로" onClick={() => moveOption(i, 1)}>
                      ↓
                    </IconButton>
                    {!o.id && (form.options.length > 1 || form.status !== 'SELLING') && (
                      <IconButton label="빼기" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}>
                        ✕
                      </IconButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="라인업 · 상세 연출">
            <p className="mb-4 text-xs text-neutral-500">메인 첫 화면 라인업과 상품 상세의 무대 · 스티커 · 색이에요. 오른쪽 미리 보기로 확인하세요.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="영문 이름 (무대 뒤 큰 글자, 예: RED BEET)" error={fieldErrors.enName}>
                <input className={`${inputClass} w-full uppercase`} maxLength={40} value={form.enName} onChange={(e) => setForm({ ...form, enName: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="구성 (예: 120ml × 30포 / 60포)" error={fieldErrors.spec}>
                <input className={`${inputClass} w-full`} maxLength={100} value={form.spec} onChange={(e) => setForm({ ...form, spec: e.target.value })} />
              </Field>
              <Field label={`스티커 문구 (한 줄에 하나, 4개까지 · ${pointCount}/4)`} error={fieldErrors.points ?? firstPointError(fieldErrors)}>
                <textarea
                  className={`${inputClass} min-h-24 w-full`}
                  placeholder={'비트 100%\n물 0% · 설탕 0%\n120ml 한 포'}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })}
                />
                <span className="mt-1 block text-xs text-neutral-400">한 줄 20자까지. 효능 · 건강 주장 문구는 넣지 마세요 (식품표시광고법).</span>
              </Field>
              <Field label="라인업 순서 (작을수록 앞)" error={fieldErrors.lineupOrder}>
                <input
                  className={`${inputClass} w-full`}
                  type="number"
                  min={0}
                  max={999}
                  required
                  value={form.lineupOrder}
                  onChange={(e) => setForm({ ...form, lineupOrder: e.target.value })}
                />
              </Field>
            </div>
            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-medium text-neutral-600">색</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(THEMES) as LineupTheme[]).map((t) => (
                  <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.theme === t ? 'border-beet-700 bg-beet-50' : 'border-neutral-200'}`}>
                    <input type="radio" name="theme" className="sr-only" checked={form.theme === t} onChange={() => setForm({ ...form, theme: t })} />
                    <span className="h-6 w-6 rounded-md border border-neutral-300" style={swatch(t)} aria-hidden="true" />
                    {THEMES[t].label}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-medium text-neutral-600">그림</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ART_LABELS) as LineupArt[]).map((a) => (
                  <label key={a} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${form.art === a ? 'border-beet-700 bg-beet-50' : 'border-neutral-200'}`}>
                    <input type="radio" name="art" className="sr-only" checked={form.art === a} onChange={() => setForm({ ...form, art: a })} />
                    {ART_LABELS[a]}
                  </label>
                ))}
              </div>
            </fieldset>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="미리 보기">
            <div className="dd-card" style={{ '--c-bg': colors.bg, '--c-fg': colors.dark ? '#fff' : '#16173d', '--c-stage': colors.stage } as CSSProperties}>
              <div className="pic" data-art={artKind(form.art)}>
                <ProductFigure key={`${form.art}-${form.artFrontUrl}-${form.artBackUrl}`} product={preview} />
              </div>
              <div className="meta">
                <b>{preview.name}</b>
                <span>
                  {form.status === 'COMING_SOON' ? '출시 예정' : form.status === 'HIDDEN' ? '비공개' : '판매중'}
                  {form.spec && ` · ${form.spec}`}
                </span>
              </div>
            </div>
            {preview.points.length > 0 && (
              <ul className="dd-points mt-3">
                {preview.points.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </Panel>

          {form.art === 'POUCH' && (
            <Panel title="파우치 도안">
              <p className="mb-3 text-xs text-neutral-500">
                실제 인쇄 도안을 펼친 앞면 · 뒷면 PNG (배경 투명, 가로:세로 = 2:3, 예: 1000×1500). 올리면 3D 파우치가 이 그림으로 바뀌어요. 비워 두면 기본 그림.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(['artFrontUrl', 'artBackUrl'] as const).map((field) => (
                  <div key={field}>
                    <p className="mb-1 text-xs font-medium text-neutral-600">{field === 'artFrontUrl' ? '앞면' : '뒷면'}</p>
                    <div className="grid aspect-[2/3] place-items-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
                      {form[field] ? <img src={form[field]} alt="" className="h-full w-full object-contain" /> : <span className="text-xs text-neutral-400">기본 그림</span>}
                    </div>
                    <label className={buttonClass('secondary', 'mt-2 w-full cursor-pointer text-xs')}>
                      {uploading === field ? '올리는 중…' : '올리기'}
                      <input type="file" accept="image/png,image/webp" className="sr-only" disabled={uploading !== null} onChange={(e) => handleFile(field, e.target.files?.[0])} />
                    </label>
                    {form[field] && (
                      <button type="button" className="mt-1 text-xs text-neutral-500 underline" onClick={() => setForm({ ...form, [field]: '' })}>
                        빼기
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-neutral-500">뒷면이 없으면 앞면을 뒤에도 써요.</p>
            </Panel>
          )}

          <Panel title="대표 이미지">
            <div className="overflow-hidden rounded-xl">
              <ProductImage src={form.imageUrl || null} alt="대표 이미지" />
            </div>
            <label className={buttonClass('secondary', 'mt-3 w-full cursor-pointer')}>
              {uploading === 'imageUrl' ? '올리는 중…' : '이미지 올리기'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={uploading !== null}
                onChange={(e) => handleFile('imageUrl', e.target.files?.[0])}
              />
            </label>
            <p className="mt-2 text-xs text-neutral-500">장바구니 · 주문 내역의 정사각 사진. jpg · png · webp · gif, 5MB 이하</p>
            {form.imageUrl && (
              <button type="button" className="mt-2 text-xs text-neutral-500 underline" onClick={() => setForm({ ...form, imageUrl: '' })}>
                이미지 빼기
              </button>
            )}
          </Panel>
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          {save.error && <ErrorMessage error={save.error} />}
          <Button type="submit" className="w-full" disabled={save.isPending || uploading !== null}>
            {save.isPending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** 스티커 문구 한 줄이 너무 길 때 서버가 points[0] 처럼 알려 준다 */
const firstPointError = (errors: Record<string, string>) => Object.entries(errors).find(([k]) => k.startsWith('points['))?.[1]

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="h-8 w-8 rounded-lg border border-neutral-300 text-sm hover:bg-neutral-100">
      {children}
    </button>
  )
}
