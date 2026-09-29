import { useEffect } from 'react'
import { useStored } from './storage'

export type ThemePref = 'system' | 'light' | 'dark'

const KEY = 'tempero:tema'

export function useTheme() {
  const [pref, setPref] = useStored<ThemePref>(KEY, 'system')

  useEffect(() => {
    const root = document.documentElement
    if (pref === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', pref)
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e1411' : '#1F5C43')
  }, [pref])

  const next = () => setPref(pref === 'system' ? 'dark' : pref === 'dark' ? 'light' : 'system')
  return { pref, next }
}
