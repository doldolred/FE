import { useEffect, useRef, type CSSProperties, type Ref } from 'react'
import { attachPouch3D, POUCH_GL_FRAME as GL_FRAME } from '../../lib/pouch'

/**
 * 3D 그림 파우치 — 프로토타입 v4(protohtml/v4-shared.js)와 같은 그림.
 * 앞면 · 뒷면 SVG 사이에 얇은 실루엣 6장을 겹쳐 두께를 낸다. 움직임은 lib/pouch.ts 의 posePouch 로 직접 바꾼다.
 * 라벨 글자만 실제 제품에 맞췄다 (120ml · 제주산).
 *
 * 관리자가 파우치 도안(펼친 앞 · 뒤 PNG, 배경 투명 · 2:3)을 올리면 그림 대신 그 도안을 쓴다 (front · back).
 * 두께 실루엣도 앞 도안을 어둡게 겹쳐 모양을 맞춘다.
 *
 * webgl 을 켜면 도안을 입힌 진짜 입체 모델(lib/pouch3d)로 바뀐다.
 *   true     돌아가는 모델 (메인의 흐르는 파우치 · 상세의 돌리는 파우치)
 *   'still'  stillAngle 각도로 한 번 찍은 상품컷 그림 (카드 · 썸네일 — 기울기 rz 는 posePouch 가 그대로 준다)
 * three.js 를 그때 불러오므로, 준비될 때까지 · WebGL 이 안 되는 기기에서는 위의 그림 파우치가 그대로 보인다.
 */

/** 캔버스는 상자보다 넉넉하게 (lineup.css .dd-pouch-gl 의 130% 와 같은 값) · 뚜껑은 상자 위로 조금 올라온다 */
/** 상품컷 크기 — 상자 폭 480px 기준 (카드의 파우치가 가장 커도 폭 ~240px, 2배 해상도) */
const STILL_W = 480
/** 상품컷은 카드 · 썸네일 칸 안에 들어가야 해서 뚜껑까지 상자 안에 (그림 파우치와 같은 크기) */
const STILL_FRAME = { box: 1 / 1.3, scale: 1 }
const noTurn = () => {}

const BODY = 'M36 44 Q100 33 164 44 C169 118 175 196 178 262 Q179 294 151 297 L49 297 Q21 294 22 262 C25 196 31 118 36 44 Z'

const rep = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i)).join('')

// 고정 문자열(사용자 입력 없음)이라 innerHTML 로 넣는다
const FRONT = `
<svg viewBox="0 0 200 300" aria-hidden="true"><defs>
  <linearGradient id="pf-body" x1="0" x2="1"><stop offset="0" stop-color="#7a0f37"/><stop offset=".18" stop-color="#c8235f"/><stop offset=".55" stop-color="#e2306f"/><stop offset=".85" stop-color="#a51850"/><stop offset="1" stop-color="#6a0c2f"/></linearGradient>
  <linearGradient id="pf-seal" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f3c6d6" stop-opacity=".9"/><stop offset="1" stop-color="#b81d57" stop-opacity=".2"/></linearGradient>
  <linearGradient id="pf-cap" x1="0" x2="1"><stop offset="0" stop-color="#cfcfcf"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#bdbdbd"/></linearGradient>
  <clipPath id="pf-clip"><path d="${BODY}"/></clipPath></defs>
  <rect x="84" y="2" width="32" height="22" rx="4" fill="url(#pf-cap)"/>
  ${rep(6, (i) => `<rect x="${87 + i * 5}" y="5" width="1.4" height="16" fill="#a9a9a9" opacity=".55"/>`)}
  <rect x="88" y="23" width="24" height="14" rx="2" fill="#f1dbe3" opacity=".9"/>
  <path d="${BODY}" fill="url(#pf-body)"/>
  <g clip-path="url(#pf-clip)">
    <rect x="0" y="34" width="200" height="22" fill="url(#pf-seal)" opacity=".55"/>
    ${rep(34, (i) => `<rect x="${24 + i * 4.6}" y="36" width="1" height="16" fill="#fff" opacity=".18"/>`)}
    <path d="M23 262 Q100 250 177 262 L177 300 L23 300 Z" fill="#3d0619" opacity=".35"/>
    <g transform="translate(100 172) skewX(-10) translate(-100 -172)">
      <text x="100" y="150" text-anchor="middle" font-family="Archivo" font-style="italic" font-weight="900" font-size="47" style="font-variation-settings:'wdth' 125" fill="#160409">RED</text>
      <text x="100" y="194" text-anchor="middle" font-family="Archivo" font-style="italic" font-weight="900" font-size="47" style="font-variation-settings:'wdth' 125" fill="#160409">BEET</text>
    </g>
  </g>
  <text x="100" y="78" text-anchor="middle" font-family="Archivo" font-style="italic" font-weight="900" font-size="12" letter-spacing="3" fill="#fff" opacity=".9">DOLDOL</text>
  <circle cx="100" cy="94" r="7.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".75"/>
  <path d="M100 87 q4 -6 8 -8 M100 87 q-3 -5 -7 -7" stroke="#7bd88f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <text x="100" y="230" text-anchor="middle" font-family="Pretendard Variable, Pretendard" font-weight="900" font-size="23" letter-spacing="-1" fill="#fff">레드비트즙</text>
  <rect x="44" y="244" width="52" height="16" rx="8" fill="none" stroke="#fff" stroke-opacity=".7"/>
  <text x="70" y="255.5" text-anchor="middle" font-family="Pretendard Variable, Pretendard" font-weight="700" font-size="8.5" fill="#fff">비트 100%</text>
  <rect x="104" y="244" width="52" height="16" rx="8" fill="#fff" fill-opacity=".9"/>
  <text x="130" y="255.5" text-anchor="middle" font-family="Pretendard Variable, Pretendard" font-weight="800" font-size="8.5" fill="#a3141f">120ml</text>
  <text x="100" y="284" text-anchor="middle" font-family="Pretendard Variable, Pretendard" font-weight="600" font-size="7" fill="#fff" opacity=".65">제주산 비트 착즙 · 무첨가</text>
</svg>`

const BACK = `
<svg viewBox="0 0 200 300" aria-hidden="true"><defs><linearGradient id="pb-body" x1="0" x2="1"><stop offset="0" stop-color="#5a0b29"/><stop offset=".5" stop-color="#9c1749"/><stop offset="1" stop-color="#4f0924"/></linearGradient></defs>
  <rect x="84" y="2" width="32" height="22" rx="4" fill="#d9d9d9"/><rect x="88" y="23" width="24" height="14" rx="2" fill="#e8cfd8" opacity=".8"/>
  <path d="${BODY}" fill="url(#pb-body)"/>
  <text x="34" y="74" font-family="Archivo" font-style="italic" font-weight="900" font-size="11" letter-spacing="2" fill="#fff" opacity=".85">DOLDOL · RED BEET</text>
  <g font-family="Pretendard Variable, Pretendard" fill="#ffe3ec" font-size="8"><text x="34" y="104">원재료명 : 비트즙 100% (제주산)</text><text x="34" y="120">내용량 : 120ml</text><text x="34" y="136">보관 : 냉장 보관</text></g>
  <rect x="34" y="246" width="64" height="30" fill="#fff" opacity=".9"/>
</svg>`

const SIL = `<svg viewBox="0 0 200 300" aria-hidden="true"><path d="${BODY}" fill="#5c1231"/><rect x="84" y="2" width="32" height="22" rx="4" fill="#9a9a9a"/></svg>`

const LAYERS = [1, 2, 3, 4, 5, 6]

interface Props {
  ref?: Ref<HTMLDivElement>
  className?: string
  style?: CSSProperties
  /** 화면 읽기용 이름. 없으면 장식으로 숨긴다 */
  label?: string
  /** 파우치 도안 앞 · 뒤 (없으면 기본 그림) */
  front?: string | null
  back?: string | null
  /** 도안이 있으면 WebGL 입체 모델로 바꾼다 (true = 돌아가는 모델, 'still' = 멈춘 상품컷) */
  webgl?: boolean | 'still'
  /** 'still' 일 때 찍는 각도(도) */
  stillAngle?: number
}

export default function SvgPouch({ ref, className = '', style, label, front, back, webgl = false, stillAngle = -18 }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const setRoot = (el: HTMLDivElement | null) => {
    rootRef.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  useEffect(() => {
    const root = rootRef.current
    const body = root?.firstElementChild
    if (!webgl || !front || !root || !body) return
    if (webgl === 'still') {
      let dead = false
      const img = document.createElement('img')
      img.className = 'dd-pouch-gl'
      img.alt = ''
      img.draggable = false
      import('../../lib/pouch3d')
        .then((m) =>
          m.renderPouchStill({ front, back }, { ry: stillAngle, width: STILL_W * 1.2, height: STILL_W * 1.5 * 1.3, frame: STILL_FRAME }),
        )
        .then((url) => {
          if (dead) return
          img.src = url
          return img.decode()
        })
        .then(() => {
          if (dead) return
          body.append(img)
          // 도는 각도는 그림에 들어 있다 — 요소는 옮기고 기울이기만
          attachPouch3D(root, noTurn)
          // 붙인 다음 프레임에 켜야 서서히 바뀐다
          requestAnimationFrame(() => !dead && root.setAttribute('data-gl', ''))
        })
        .catch(() => {
          // WebGL 을 못 쓰거나 도안을 못 읽으면 그림 파우치로 남는다
        })
      return () => {
        dead = true
        if (img.isConnected) {
          attachPouch3D(root, null)
          root.removeAttribute('data-gl')
          img.remove()
        }
      }
    }
    // 실행마다 새 캔버스 — 한 캔버스에 렌더러를 두 번 붙이지 않는다
    const canvas = document.createElement('canvas')
    canvas.className = 'dd-pouch-gl'
    body.append(canvas)
    let dead = false
    let dispose: (() => void) | undefined
    import('../../lib/pouch3d')
      .then((m) => (dead ? null : m.createPouch3D(canvas, { front, back }, GL_FRAME)))
      .then((pouch) => {
        if (!pouch) return
        if (dead) return pouch.dispose()
        dispose = pouch.dispose
        attachPouch3D(root, pouch.setRotation)
        root.setAttribute('data-gl', '')
      })
      .catch(() => {
        // WebGL 을 못 쓰거나 도안을 못 읽으면 그림 파우치로 남는다
      })
    return () => {
      dead = true
      if (dispose) {
        attachPouch3D(root, null)
        root.removeAttribute('data-gl')
        dispose()
      }
      canvas.remove()
    }
  }, [webgl, front, back, stillAngle])

  return (
    <div
      ref={setRoot}
      className={`dd-pouch ${className}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="dd-pouch-body">
        {LAYERS.map((k) =>
          front ? (
            <div key={k} className="layer" style={{ transform: `translateZ(${-k * 1.3}px)` }}>
              <img src={front} alt="" className="dd-pouch-art silhouette" draggable={false} />
            </div>
          ) : (
            <div key={k} className="layer" style={{ transform: `translateZ(${-k * 1.3}px)` }} dangerouslySetInnerHTML={{ __html: SIL }} />
          ),
        )}
        <div className="face front">
          {front ? (
            <img src={front} alt="" className="dd-pouch-art" draggable={false} />
          ) : (
            <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: FRONT }} />
          )}
          {/* 도안이 있으면 빛 띠도 도안 모양 안에서만 */}
          <div className="sheen" style={front ? artMask(front) : undefined} />
        </div>
        {back || front ? (
          <div className="face back">
            <img src={back ?? front!} alt="" className="dd-pouch-art" draggable={false} />
          </div>
        ) : (
          <div className="face back" dangerouslySetInnerHTML={{ __html: BACK }} />
        )}
      </div>
    </div>
  )
}

const artMask = (src: string): CSSProperties => {
  const mask = `url("${src}") center / contain no-repeat`
  return { inset: 0, borderRadius: 0, mask, WebkitMask: mask }
}
