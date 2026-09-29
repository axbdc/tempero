import { useSyncExternalStore } from 'react'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
}

let deferred: InstallEvent | null = null
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as InstallEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export function registerSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sem modo offline */
    })
  })
}

export function useInstall() {
  const canPrompt = useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => {
        subs.delete(cb)
      }
    },
    () => deferred !== null,
    () => false,
  )
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    deferred = null
    emit()
  }
  return { canPrompt, standalone, ios, install }
}
