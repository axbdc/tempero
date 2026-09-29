import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const KEY = 'tempero:favoritos'

interface Ctx {
  favorites: string[]
  isFavorite: (slug: string) => boolean
  toggle: (slug: string) => void
}

const FavoritesContext = createContext<Ctx | null>(null)

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(favorites))
    } catch {
      /* armazenamento indisponível */
    }
  }, [favorites])

  const toggle = useCallback((slug: string) => {
    setFavorites((f) => (f.includes(slug) ? f.filter((s) => s !== slug) : [...f, slug]))
  }, [])

  const value = useMemo(
    () => ({ favorites, isFavorite: (s: string) => favorites.includes(s), toggle }),
    [favorites, toggle],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites fora do provider')
  return ctx
}
