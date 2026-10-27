import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createNotice, deleteNotice, fetchAdminNotice, fetchAdminNotices, updateNotice } from '../../api/admin'
import type { Notice, NoticeRequest } from '../../api/types'
import Panel from '../../components/admin/Panel'
import { NoticeArticle } from '../../components/NoticeArticle'
import Button from '../../components/ui/Button'
import { buttonClass } from '../../components/ui/buttonStyles'
import { ErrorMessage, Loading } from '../../components/ui/Status'
import { inputClass } from '../../lib/admin'
import { formatDate } from '../../lib/format'
import { Pager } from './AdminOrdersPage'

const KEY = ['admin', 'notices'] as const

/** 공지사항 목록 — 비공개(초안) 포함. 고정 먼저 → 최신순 (손님 화면과 같은 순서) */
export function AdminNoticesPage() {
  const [page, setPage] = useState(0)
  const { data, isPending, error } = useQuery({ queryKey: [...KEY, page], queryFn: () => fetchAdminNotices(page) })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">공지사항</h1>
          <p className="mt-1 text-sm text-neutral-500">공개한 공지만 쇼핑몰 공지사항(/notices)에 보여요. 고정하면 맨 위에 와요.</p>
        </div>
        <Link to="/admin/notices/new" className={buttonClass('primary')}>
          새 공지 쓰기
        </Link>
      </div>

      <Panel>
        {isPending ? (
          <Loading />
        ) : error ? (
          <ErrorMessage error={error} />
        ) : data.content.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">아직 공지가 없어요.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">제목</th>
                  <th className="w-24 pb-2 font-medium">상태</th>
                  <th className="hidden w-44 pb-2 font-medium sm:table-cell">쓴 날</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.content.map((n) => (
                  <tr key={n.id}>
                    <td className="py-3">
                      <Link to={`/admin/notices/${n.id}`} className="font-medium hover:underline">
                        {n.pinned && <span className="mr-2 rounded bg-beet-700 px-1.5 py-0.5 text-xs font-bold text-white">고정</span>}
                        {n.title}
                      </Link>
                    </td>
                    <td className="py-3">
                      <StatusBadge notice={n} />
                    </td>
                    <td className="hidden py-3 text-neutral-500 sm:table-cell">{formatDate(n.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={data.page} totalPages={data.totalPages} total={data.totalElements} onPage={setPage} />
          </>
        )}
      </Panel>
    </div>
  )
}

function StatusBadge({ notice }: { notice: Notice }) {
  return notice.published ? (
    <span className="text-xs font-semibold text-emerald-700">공개</span>
  ) : (
    <span className="text-xs font-semibold text-neutral-400">비공개</span>
  )
}

/** /admin/notices/new · /admin/notices/:id — 쓰기 · 고치기 (오른쪽에 손님 화면 미리보기) */
export function AdminNoticeEditPage() {
  const param = useParams().id
  const id = param === 'new' ? null : Number(param)
  const { data, isPending, error } = useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => fetchAdminNotice(id!),
    enabled: id !== null,
  })

  if (id !== null && isPending) return <Loading />
  if (error) return <ErrorMessage error={error} />
  // key: 다른 공지로 옮겨 가면 입력칸을 그 공지로 새로 채운다
  return <NoticeForm key={id ?? 'new'} notice={data ?? null} />
}

function NoticeForm({ notice }: { notice: Notice | null }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // 새 공지 미리보기의 날짜 — 렌더마다 바뀌지 않게 처음 한 번만
  const [now] = useState(() => new Date().toISOString())
  const [form, setForm] = useState<NoticeRequest>(
    notice
      ? { title: notice.title, content: notice.content, pinned: notice.pinned, published: notice.published }
      : { title: '', content: '', pinned: false, published: true },
  )

  const save = useMutation({
    mutationFn: () => (notice ? updateNotice(notice.id, form) : createNotice(form)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      if (!notice) navigate(`/admin/notices/${saved.id}`, { replace: true })
    },
  })
  const remove = useMutation({
    mutationFn: () => deleteNotice(notice!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      navigate('/admin/notices', { replace: true })
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/notices" className="text-sm text-neutral-500 hover:underline">
            ← 공지사항
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{notice ? '공지 고치기' : '새 공지'}</h1>
        </div>
        {notice?.published && (
          <a href={`/notices/${notice.id}`} target="_blank" rel="noreferrer" className="text-sm text-neutral-500 hover:underline">
            쇼핑몰에서 보기 ↗
          </a>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="내용">
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">제목</span>
              <input
                className={`${inputClass} w-full`}
                required
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 추석 연휴 배송 안내"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">본문</span>
              <textarea
                className={`${inputClass} min-h-72 w-full leading-relaxed`}
                required
                maxLength={20000}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="줄바꿈은 그대로 보여요."
              />
            </label>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                공개 (끄면 손님에게 안 보여요)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
                맨 위 고정
              </label>
            </div>

            {save.error && <ErrorMessage error={save.error} />}
            {save.isSuccess && <p className="text-sm text-emerald-700">저장했어요.</p>}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={save.isPending}>
                {notice ? '저장' : '등록'}
              </Button>
              {notice && (
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto text-red-600 hover:bg-red-50"
                  disabled={remove.isPending}
                  onClick={() => window.confirm('이 공지를 지울까요? 되돌릴 수 없어요.') && remove.mutate()}
                >
                  삭제
                </Button>
              )}
            </div>
            {remove.error && <ErrorMessage error={remove.error} />}
          </form>
        </Panel>

        <Panel title="미리보기 — 손님 화면">
          {form.title.trim() || form.content.trim() ? (
            <NoticeArticle
              title={form.title.trim() || '(제목 없음)'}
              content={form.content.trim()}
              pinned={form.pinned}
              date={notice?.createdAt ?? now}
            />
          ) : (
            <p className="py-10 text-center text-sm text-neutral-400">제목과 본문을 쓰면 여기에 보여요.</p>
          )}
          {!form.published && <p className="mt-4 text-xs text-neutral-500">비공개 — 저장해도 손님에게는 안 보여요.</p>}
        </Panel>
      </div>
    </div>
  )
}
