import { useCallback, useEffect, useRef, useState } from 'react'

export interface TimerState {
  total: number // segundos
  remaining: number // segundos (quando pausado)
  endAt: number | null // timestamp quando a correr
  done: boolean
}

let audioCtx: AudioContext | null = null

function beep() {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const ctx = audioCtx
    const now = ctx.currentTime
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(now + t)
      o.stop(now + t + 0.22)
    })
    navigator.vibrate?.([300, 150, 300])
  } catch {
    /* áudio indisponível */
  }
}

/** Desbloqueia o áudio num gesto do utilizador (necessário em iOS). */
export function unlockAudio() {
  try {
    audioCtx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    /* ignorar */
  }
}

export function remainingOf(t: TimerState, now = Date.now()) {
  if (t.endAt) return Math.max(0, Math.ceil((t.endAt - now) / 1000))
  return t.remaining
}

export function formatClock(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useTimers() {
  const [timers, setTimers] = useState<Record<number, TimerState>>({})
  const [, setTick] = useState(0)
  const ringing = useRef<number | null>(null)

  const anyRunning = Object.values(timers).some((t) => t.endAt)
  const anyDone = Object.values(timers).some((t) => t.done)

  useEffect(() => {
    if (!anyRunning) return
    const id = window.setInterval(() => {
      const now = Date.now()
      setTimers((prev) => {
        let changed = false
        const next = { ...prev }
        for (const [k, t] of Object.entries(prev)) {
          if (t.endAt && t.endAt <= now) {
            next[Number(k)] = { ...t, endAt: null, remaining: 0, done: true }
            changed = true
          }
        }
        return changed ? next : prev
      })
      setTick((x) => x + 1)
    }, 250)
    return () => window.clearInterval(id)
  }, [anyRunning])

  // Alarme repetido enquanto houver temporizadores terminados por confirmar
  useEffect(() => {
    if (!anyDone) {
      if (ringing.current) window.clearInterval(ringing.current)
      ringing.current = null
      return
    }
    beep()
    ringing.current = window.setInterval(beep, 2500)
    return () => {
      if (ringing.current) window.clearInterval(ringing.current)
      ringing.current = null
    }
  }, [anyDone])

  const start = useCallback((step: number, minutes: number) => {
    unlockAudio()
    setTimers((prev) => {
      const cur = prev[step]
      const total = Math.round(minutes * 60)
      const remaining = cur && !cur.done && cur.remaining > 0 ? cur.remaining : total
      return { ...prev, [step]: { total, remaining, endAt: Date.now() + remaining * 1000, done: false } }
    })
  }, [])

  const pause = useCallback((step: number) => {
    setTimers((prev) => {
      const cur = prev[step]
      if (!cur?.endAt) return prev
      return { ...prev, [step]: { ...cur, remaining: remainingOf(cur), endAt: null } }
    })
  }, [])

  const reset = useCallback((step: number) => {
    setTimers((prev) => {
      const n = { ...prev }
      delete n[step]
      return n
    })
  }, [])

  const addMinute = useCallback((step: number) => {
    setTimers((prev) => {
      const cur = prev[step]
      if (!cur) return prev
      if (cur.endAt) return { ...prev, [step]: { ...cur, endAt: cur.endAt + 60_000, total: cur.total + 60 } }
      return { ...prev, [step]: { ...cur, remaining: cur.remaining + 60, total: cur.total + 60, done: false } }
    })
  }, [])

  return { timers, start, pause, reset, addMinute }
}
