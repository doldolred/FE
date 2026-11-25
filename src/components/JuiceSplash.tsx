import { useEffect } from 'react'

/** 누르면 방울이 튀는 것들 — 링크 · 버튼 · 고르는 칸 */
const TARGET = 'a, button, summary, label.dd-choice, [role="button"], [role="radio"], [role="tab"]'
const DROPS = 6

/**
 * 손님 화면에서 누를 수 있는 것을 누르면 그 자리에서 즙 방울이 튄다 (모양은 styles/juice.css .dd-splash).
 * click 에 건다 — 터치로 화면을 밀 때는 안 튀고, 키보드(Enter)로 눌러도 튄다.
 */
export default function JuiceSplash() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const onClick = (e: MouseEvent) => {
      if (reduced.matches || !(e.target instanceof Element)) return
      const el = e.target.closest(TARGET)
      if (!el || el.matches(':disabled, [aria-disabled="true"]')) return

      // 키보드로 누르면 좌표가 없다 — 그때는 요소 한가운데서
      let x = e.clientX
      let y = e.clientY
      if (e.detail === 0) {
        const r = el.getBoundingClientRect()
        x = r.left + r.width / 2
        y = r.top + r.height / 2
      }

      const splash = document.createElement('div')
      splash.className = 'dd-splash'
      splash.style.left = `${x}px`
      splash.style.top = `${y}px`

      for (let i = 0; i < DROPS; i++) {
        const drop = document.createElement('i')
        const size = 6 + Math.random() * 7
        drop.style.width = drop.style.height = `${size}px`
        // 위쪽 부채꼴로 튀었다가 아래로 떨어진다
        const angle = -Math.PI * (0.08 + (i + Math.random()) * (0.84 / DROPS))
        const reach = 24 + Math.random() * 30
        const dx = Math.cos(angle) * reach
        const dy = Math.sin(angle) * reach
        splash.append(drop)
        drop.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 0.45 },
            { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + 38}px)) scale(0.5)`, opacity: 0 },
          ],
          { duration: 520 + Math.random() * 180, easing: 'cubic-bezier(0.25, 0.6, 0.4, 1)', fill: 'forwards' },
        )
      }

      document.body.append(splash)
      window.setTimeout(() => splash.remove(), 800)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
