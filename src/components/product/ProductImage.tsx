interface Props {
  src: string | null
  alt: string
  className?: string
}

/** 이미지가 아직 없을 때는 비트색 플레이스홀더 */
export default function ProductImage({ src, alt, className = '' }: Props) {
  if (src) {
    return <img src={src} alt={alt} className={`aspect-square w-full object-cover ${className}`} />
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex aspect-square w-full items-center justify-center bg-gradient-to-br from-beet-600 to-beet-900 text-2xl font-bold tracking-widest text-beet-100 ${className}`}
    >
      BEET
    </div>
  )
}
