import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 위시리스트 — 찜한 상품 id. 이 브라우저에 저장한다 (로그인 없이도 쓸 수 있고, 기기마다 따로).
 * 상품 정보(이름 · 가격 · 상태)는 화면에서 /api/products 로 다시 읽어서, 비공개가 된 상품은 저절로 빠진다.
 */
interface WishState {
  ids: number[]
  toggle: (id: number) => void
  remove: (id: number) => void
}

export const useWishStore = create<WishState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [id, ...s.ids] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
    }),
    { name: 'doldol-wish' },
  ),
)

export const useIsWished = (id: number) => useWishStore((s) => s.ids.includes(id))
