import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { changeProductActive, createProduct, fetchAdminProduct, fetchAdminProducts, updateProduct, uploadImage } from '../../api/admin'
import type { AdminProduct, AdminProductRequest } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { inputClass } from '../../lib/admin'
import ProductImage from '../../components/product/ProductImage'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { Empty, ErrorMessage, Loading } from '../../components/ui/Status'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import { formatPrice } from '../../lib/format'

export function AdminProductsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, error } = useQuery({ queryKey: ['admin', 'products'], queryFn: fetchAdminProducts })
  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => changeProductActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품</h1>
        <Link to="/admin/products/new" className={buttonClass('primary')}>
          상품 등록
        </Link>
      </div>
      {activeMutation.error && <ErrorMessage error={activeMutation.error} />}
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
                <div className="w-20 shrink-0 overflow-hidden rounded-lg">
                  <ProductImage src={p.imageUrl} alt={p.name} className="text-xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {p.name}
                    {!p.active && <span className="ml-2 rounded bg-neutral-200 px-2 py-0.5 text-xs font-normal">판매중지</span>}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                    {p.options.map((o) => (
                      <li key={o.id} className={`rounded-full border px-3 py-1 ${o.active ? 'border-neutral-300' : 'border-dashed border-neutral-300 text-neutral-400'}`}>
                        {o.name} · {formatPrice(o.price)} · 재고 <b className={o.stock === 0 ? 'text-red-600' : ''}>{o.stock}</b>
                        {!o.active && ' · 중지'}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" disabled={activeMutation.isPending} onClick={() => activeMutation.mutate({ id: p.id, active: !p.active })}>
                    {p.active ? '판매중지' : '판매재개'}
                  </Button>
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

type OptionForm = { id?: number; name: string; listPrice: string; price: string; stock: string; active: boolean }
const blankOption = (): OptionForm => ({ name: '', listPrice: '', price: '', stock: '0', active: true })

function toForm(p?: AdminProduct) {
  return {
    name: p?.name ?? '',
    description: p?.description ?? '',
    imageUrl: p?.imageUrl ?? '',
    active: p?.active ?? true,
    // 판매중지된 옵션도 보여 줘서 다시 켤 수 있게
    options: p?.options.length
      ? p.options.map((o) => ({ id: o.id, name: o.name, listPrice: String(o.listPrice), price: String(o.price), stock: String(o.stock), active: o.active }))
      : [blankOption()],
  }
}

/** /admin/products/new · /admin/products/:id — 상품 + 옵션(10포 · 30포 · 60포 …) + 대표 이미지 */
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

function ProductForm({ product }: { product?: AdminProduct }) {
  const isNew = !product
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(() => toForm(product))
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const save = useMutation({
    mutationFn: () => {
      const req: AdminProductRequest = {
        name: form.name,
        description: form.description,
        imageUrl: form.imageUrl,
        active: form.active,
        options: form.options.map((o) => ({
          id: o.id,
          name: o.name,
          listPrice: Number(o.listPrice || o.price),
          price: Number(o.price),
          stock: Number(o.stock),
          active: o.active,
        })),
      }
      return product ? updateProduct(product.id, req) : createProduct(req)
    },
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
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

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (e) {
      setUploadError(getErrorMessage(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

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
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-beet-700" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                판매중 (끄면 손님 화면에서 사라져요)
              </label>
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
            </p>
            {fieldErrors.options && <p className="mb-2 text-xs text-red-600">{fieldErrors.options}</p>}
            <div className="space-y-3">
              {form.options.map((o, i) => (
                <div key={o.id ?? `new-${i}`} className={`grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] sm:items-end ${o.active ? 'border-neutral-200' : 'border-dashed border-neutral-300 bg-neutral-50'}`}>
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
                    {!o.id && form.options.length > 1 && (
                      <IconButton label="빼기" onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}>
                        ✕
                      </IconButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="대표 이미지">
            <div className="overflow-hidden rounded-xl">
              <ProductImage src={form.imageUrl || null} alt="대표 이미지" />
            </div>
            <label className={buttonClass('secondary', 'mt-3 w-full cursor-pointer')}>
              {uploading ? '올리는 중…' : '이미지 올리기'}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(e) => handleFile(e.target.files?.[0])} />
            </label>
            <p className="mt-2 text-xs text-neutral-500">jpg · png · webp · gif, 5MB 이하</p>
            {form.imageUrl && (
              <button type="button" className="mt-2 text-xs text-neutral-500 underline" onClick={() => setForm({ ...form, imageUrl: '' })}>
                이미지 빼기
              </button>
            )}
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </Panel>
          {save.error && <ErrorMessage error={save.error} />}
          <Button type="submit" className="w-full" disabled={save.isPending || uploading}>
            {save.isPending ? '저장 중…' : '저장'}
          </Button>
        </div>
      </div>
    </form>
  )
}

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
