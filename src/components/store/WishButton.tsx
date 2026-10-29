import { useIsWished, useWishStore } from '../../stores/wishStore'

/** 찜 하트 — 누르면 위시리스트에 넣고 빼기 */
export default function WishButton({ productId, name, size }: { productId: number; name: string; size?: 'sm' }) {
  const wished = useIsWished(productId)
  const toggle = useWishStore((s) => s.toggle)
  return (
    <button
      type="button"
      className="dd-heart"
      data-size={size}
      aria-pressed={wished}
      aria-label={wished ? `${name} 위시리스트에서 빼기` : `${name} 위시리스트에 담기`}
      title={wished ? '위시리스트에서 빼기' : '위시리스트에 담기'}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(productId)
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 3.1 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.8 0 5.9 3.9 4.5 7.2C19.5 16.4 12 21 12 21z"
          fill={wished ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
