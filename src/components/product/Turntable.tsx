import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../lib/useScroll'
import ProductImage from './ProductImage'

/** 한 바퀴를 count 장으로 나눈 사진 묶음. 예: /showcase/beet/t001.webp … t072.webp */
export interface FrameSequence {
  base: string
  pad: number
  ext: string
  count: number
}

interface Props {
  frames: FrameSequence | null
  /** frames 가 없을 때 보이는 정지 사진 */
  poster: string | null
  alt: string
  /** 보이는 장이 바뀔 때. index / count 가 회전 진행(0 → 1) */
  onFrame?: (index: number, count: number) => void
  className?: string
}

const PX_PER_TURN = 700 // 가로로 700px 끌면 한 바퀴
const AUTO_TURN_MS = 14000 // 가만히 두면 14초에 한 바퀴
const IDLE_BEFORE_AUTO = 1600

/**
 * 360° 턴테이블 — 영상 대신 사진 묶음을 캔버스에 그리고, 가로 드래그 · 방향키로 돌린다.
 * 놓으면 관성으로 조금 더 돌다 멈추고, 가만히 두면 천천히 자동 회전. 움직임 줄임 설정이면 자동 회전 없음.
 * 사진은 첫 장 먼저, 나머지는 여덟 장씩 받는다. 아직 안 온 장은 가장 가까운 받은 장으로 그린다.
 */
export default function Turntable({ frames, poster, alt, onFrame, className = '' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const onFrameRef = useRef(onFrame)
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx || !frames) return

    const count = frames.count
    const images: (HTMLImageElement | null)[] = new Array(count).fill(null)
    let alive = true
    let pos = 0 // 실수 프레임 위치
    let drawn = -1
    let velocity = 0 // 프레임 / ms
    let dragging = false
    let lastX = 0
    let lastT = 0
    let idleSince = performance.now()
    let prevTick = 0
    let raf = 0
    const auto = reduced ? 0 : count / AUTO_TURN_MS

    const src = (i: number) => `${frames.base}${String(i + 1).padStart(frames.pad, '0')}${frames.ext}`
    const nearestLoaded = (i: number) => {
      for (let d = 0; d < count; d++) {
        if (images[i - d]?.complete) return images[i - d]!
        if (images[i + d]?.complete) return images[i + d]!
      }
      return null
    }

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv!.width = Math.round(cv!.clientWidth * dpr)
      cv!.height = Math.round(cv!.clientHeight * dpr)
      drawn = -1
    }

    function draw(i: number) {
      const img = images[i]?.complete ? images[i]! : nearestLoaded(i)
      if (!img?.naturalWidth) return
      // object-fit: contain — 상품 전체가 보이게
      const scale = Math.min(cv!.width / img.naturalWidth, cv!.height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx!.clearRect(0, 0, cv!.width, cv!.height)
      ctx!.drawImage(img, (cv!.width - w) / 2, (cv!.height - h) / 2, w, h)
      drawn = i
      onFrameRef.current?.(i, count)
    }

    const frameIndex = () => (((Math.round(pos) % count) + count) % count)

    function tick(now: number) {
      raf = 0
      const dt = prevTick ? Math.min(now - prevTick, 50) : 16
      prevTick = now
      if (!dragging) {
        if (Math.abs(velocity) > 0.0004) {
          pos += velocity * dt
          velocity *= Math.pow(0.94, dt / 16)
        } else {
          velocity = 0
          if (auto && now - idleSince > IDLE_BEFORE_AUTO) pos += auto * dt
        }
      }
      const i = frameIndex()
      if (i !== drawn) draw(i)
      if (dragging || velocity !== 0 || auto) raf = requestAnimationFrame(tick)
      else prevTick = 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      velocity = 0
      lastX = e.clientX
      lastT = e.timeStamp
      cv!.setPointerCapture(e.pointerId)
      wake()
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dt = Math.max(1, e.timeStamp - lastT)
      pos += (dx / PX_PER_TURN) * count
      velocity = ((dx / PX_PER_TURN) * count) / dt
      lastX = e.clientX
      lastT = e.timeStamp
    }
    const onPointerUp = () => {
      dragging = false
      idleSince = performance.now()
      wake()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      pos += e.key === 'ArrowRight' ? 3 : -3
      idleSince = performance.now()
      wake()
    }

    size()
    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = img.onerror = () => {
          images[i] = img
          resolve()
        }
        img.src = src(i)
      })
    load(0).then(async () => {
      if (!alive) return
      draw(0)
      wake()
      for (let i = 1; i < count && alive; i += 8) {
        await Promise.all(Array.from({ length: Math.min(8, count - i) }, (_, k) => load(i + k)))
        if (alive) drawn = -1 // 더 가까운 장이 왔을 수 있으니 다시 그린다
      }
    })

    const ro = new ResizeObserver(() => {
      size()
      wake()
    })
    ro.observe(cv)
    cv.addEventListener('pointerdown', onPointerDown)
    cv.addEventListener('pointermove', onPointerMove)
    cv.addEventListener('pointerup', onPointerUp)
    cv.addEventListener('pointercancel', onPointerUp)
    cv.addEventListener('keydown', onKeyDown)
    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      cv.removeEventListener('pointerdown', onPointerDown)
      cv.removeEventListener('pointermove', onPointerMove)
      cv.removeEventListener('pointerup', onPointerUp)
      cv.removeEventListener('pointercancel', onPointerUp)
      cv.removeEventListener('keydown', onKeyDown)
    }
  }, [frames, reduced])

  if (!frames) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <ProductImage src={poster} alt={alt} className="!aspect-auto h-full w-full !bg-transparent !object-contain" />
      </div>
    )
  }

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={`${alt} — 좌우로 끌거나 방향키로 돌려 볼 수 있어요`}
      tabIndex={0}
      className={`block h-full w-full cursor-grab touch-pan-y select-none outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-beet-300 ${className}`}
    />
  )
}
