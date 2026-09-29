import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Home, Search, UtensilsCrossed } from 'lucide-react'
import { Logo } from './Logo'
import { categories } from '../data'
import { useFavorites } from '../lib/favorites'

function HeaderSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/receitas?q=${encodeURIComponent(q.trim())}` : '/receitas')
    setQ('')
  }
  return (
    <form onSubmit={submit} className="relative hidden w-72 lg:block" role="search">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pesquisar receitas ou ingredientes"
        aria-label="Pesquisar receitas"
        className="h-10 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/80 focus:border-herb-500 focus:bg-white focus:ring-4 focus:ring-herb-100"
      />
    </form>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const { favorites } = useFavorites()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition ${isActive ? 'text-herb-700' : 'text-muted'}`

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to="/" aria-label="Tempero — início">
            <Logo />
          </Link>
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Categorias">
            {categories.map((c) => (
              <NavLink
                key={c.id}
                to={`/receitas?cat=${c.id}`}
                className="rounded-full px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-herb-50 hover:text-herb-700"
              >
                {c.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <HeaderSearch />
            <Link
              to="/receitas"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-herb-50 lg:hidden"
              aria-label="Pesquisar"
            >
              <Search size={20} />
            </Link>
            <Link
              to="/favoritos"
              className="relative hidden h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-herb-50 md:grid"
              aria-label="Favoritos"
            >
              <Heart size={20} />
              {favorites.length > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      <footer className="mt-20 hidden border-t border-line bg-paper md:block">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-muted">
              Receitas simples, passo a passo, com medidas de cozinha (chávenas e colheres) e temporizadores. Sem balança.
            </p>
          </div>
          <p className="text-xs text-muted">
            Fotografias via{' '}
            <a className="underline hover:text-ink" href="https://unsplash.com" target="_blank" rel="noreferrer">
              Unsplash
            </a>
            . © {new Date().getFullYear()} Tempero
          </p>
        </div>
      </footer>

      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-xl md:hidden"
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex max-w-md">
          <NavLink to="/" end className={tab}>
            <Home size={21} /> Início
          </NavLink>
          <NavLink to="/receitas" className={tab}>
            <UtensilsCrossed size={21} /> Receitas
          </NavLink>
          <NavLink to="/favoritos" className={tab}>
            <span className="relative">
              <Heart size={21} />
              {favorites.length > 0 && (
                <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">
                  {favorites.length}
                </span>
              )}
            </span>
            Favoritos
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
