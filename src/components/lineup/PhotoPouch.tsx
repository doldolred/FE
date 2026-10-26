import type { CSSProperties, Ref } from 'react'
import type { PouchPhotos } from '../../data/lineup'

interface Props {
  photos: PouchPhotos
  alt: string
  ref?: Ref<HTMLDivElement>
  className?: string
  style?: CSSProperties
}

/**
 * 사진 파우치 — 프로토타입 v4 의 3D 그림 파우치 대신 실제 사진(정면 · 왼쪽 · 오른쪽)을 쓴다.
 * 움직임은 lib/pouch.ts 의 posePouch 로 직접 바꾼다 (스크롤 · 드래그마다 React 렌더 없이).
 */
export default function PhotoPouch({ photos, alt, ref, className = '', style }: Props) {
  return (
    <div
      ref={ref}
      className={`dd-pouch ${className}`}
      data-pick="front"
      style={{ ...style, '--mask': `url(${photos.front})` } as CSSProperties}
    >
      <div className="dd-pouch-body">
        <img data-a="left" src={photos.left} alt="" aria-hidden="true" draggable={false} />
        <img data-a="front" src={photos.front} alt={alt} draggable={false} />
        <img data-a="right" src={photos.right} alt="" aria-hidden="true" draggable={false} />
        <span className="sheen" aria-hidden="true" />
      </div>
    </div>
  )
}
