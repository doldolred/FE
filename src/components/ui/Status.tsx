import type { ReactNode } from 'react'
import { getErrorMessage } from '../../lib/errors'

export function Loading() {
  return <p className="py-20 text-center text-sm text-neutral-500">불러오는 중…</p>
}

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <p role="alert" className="ui-alert rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
      {getErrorMessage(error)}
    </p>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="ui-empty py-20 text-center text-neutral-500">{children}</div>
}
