import { useCallback, useSyncExternalStore } from 'react'

const EVT = 'tempero:storage'
const mem = new Map<string, string>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function getRaw(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? mem.get(key) ?? null
  } catch {
    return mem.get(key) ?? null
  }
}

function read<T>(key: string, fallback: T): T {
  const raw = getRaw(key)
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value = fallback
  if (raw) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = fallback
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function writeStored<T>(key: string, value: T) {
  const raw = JSON.stringify(value)
  mem.set(key, raw)
  try {
    localStorage.setItem(key, raw)
  } catch {
    /* modo privado: fica só em memória */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }))
}

/** Estado guardado no dispositivo (localStorage), sincronizado entre componentes e separadores. */
export function useStored<T>(key: string, fallback: T) {
  const subscribe = useCallback(
    (cb: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) cb()
      }
      const onLocal = (e: Event) => {
        if ((e as CustomEvent<string>).detail === key) cb()
      }
      window.addEventListener('storage', onStorage)
      window.addEventListener(EVT, onLocal)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(EVT, onLocal)
      }
    },
    [key],
  )
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  )
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, fallback)
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      writeStored(key, v)
    },
    [key, fallback],
  )
  return [value, set] as const
}
