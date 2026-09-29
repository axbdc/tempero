import { useEffect, useState } from 'react'

const KEY = 'tempero:splash'

/** Ecrã de entrada animado (uma vez por sessão). */
export function Splash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'done'>(() => {
    try {
      if (sessionStorage.getItem(KEY)) return 'done'
    } catch {
      /* sem storage */
    }
    return 'in'
  })

  useEffect(() => {
    if (phase !== 'in') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.body.style.overflow = 'hidden'
    const t1 = window.setTimeout(() => setPhase('out'), reduce ? 350 : 2200)
    const t2 = window.setTimeout(() => {
      setPhase('done')
      document.body.style.overflow = ''
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        /* sem storage */
      }
    }, reduce ? 650 : 3000)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      document.body.style.overflow = ''
    }
  }, [phase])

  if (phase === 'done') return null

  return (
    <div className={`splash ${phase === 'out' ? 'splash-out' : ''}`} aria-hidden="true">
      <div className="splash-glow" />
      <div className="splash-ring" />
      <svg viewBox="0 0 64 64" className="splash-mark">
        <path className="sp-leaf2" d="M31.5 31C27.8 25.6 22.6 23.4 17 24.6c2.4 5 7.8 7.4 14.5 6.4z" fill="#9FD3B0" />
        <path className="sp-leaf1" d="M32.5 31C30.4 21.6 34.6 13.4 44.6 10.6c1.6 10.2-3.6 18-12.1 20.4z" fill="#F2B544" />
        <path className="sp-bowl" d="M12 33h40c0 11-9 19-20 19S12 44 12 33z" fill="#FFFFFF" />
      </svg>
      <div className="splash-word">
        {'tempero'.split('').map((c, i) => (
          <span key={i} style={{ animationDelay: `${0.95 + i * 0.055}s` }}>
            {c}
          </span>
        ))}
      </div>
      <p className="splash-tag">Receitas passo a passo</p>
    </div>
  )
}
