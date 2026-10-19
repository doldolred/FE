import type { ReactNode } from 'react'

export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm py-8">
      <h1 className="mb-8 text-center text-2xl font-bold">{title}</h1>
      {children}
    </div>
  )
}
