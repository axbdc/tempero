import { useSyncExternalStore } from 'react'

let current: { id: number; msg: string } | null = null
const subs = new Set<() => void>()
let timer = 0
const emit = () => subs.forEach((f) => f())

export function toast(msg: string) {
  current = { id: Date.now(), msg }
  emit()
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    current = null
    emit()
  }, 2600)
}

export function useToast() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    () => current,
    () => null,
  )
}
