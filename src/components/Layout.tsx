import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Heart,
  Home,
  Monitor,
  Moon,
  Refrigerator,
  Search,
  ShoppingBasket,
  Sun,
  UtensilsCrossed,
} from 'lucide-react'
import { Logo } from './Logo'
import { useFavorites } from '../lib/favorites'
import { useShopping } from '../lib/shopping'
import { useTheme } from '../lib/theme'
import { useToast } from '../lib/toast'

function HeaderSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? `/receitas?q=${encodeURIComponent(q.trim())}` : '/receitas')
    setQ('')
  }
  return (
    <form onSubmit={submit} className="relative hidden w-60 xl:block" role="search">
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pesquisar receitas"
        aria-label="Pesquisar receitas"
        className="h-10 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm outline-none transition placeholder:text-muted/80 focus:border-herb-500 focus:bg-paper focus:ring-4 focus:ring-herb-100"
      />
    </form>
  )
}

function ThemeToggle() {
  const { pref, next } = useTheme()
  const Icon = pref === 'dark' ? Moon : pref === 'light' ? Sun : Monitor
  const label = pref === 'dark' ? 'Tema escuro' : pref === 'light' ? 'Tema claro' : 'Tema do sistema'
  return (
    <button
      onClick={next}
      className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-herb-50"
      aria-label={`${label} (mudar)`}
      title={label}
    >
      <Icon key={pref} size={19} className="animate-spin-in" />
    </button>
  )
}

function Badge({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">
      {n}
    </span>
  )
}

const MAIN_NAV = [
  { to: '/receitas', label: 'Receitas', icon: UtensilsCrossed },
  { to: '/frigorifico', label: 'Frigorífico', icon: Refrigerator },
  { to: '/plano', label: 'Plano', icon: CalendarDays },
  { to: '/lista', label: 'Lista', icon: ShoppingBasket },
]

export function Layout() {
  const { pathname } = useLocation()
  const { favorites } = useFavorites()
  const { pending } = useShopping()
  const toast = useToast()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const desk = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-herb-50 text-herb-700' : 'text-ink/80 hover:bg-herb-50 hover:text-herb-700'
    }`
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-semibold transition ${isActive ? 'text-herb-700' : 'text-muted'}`

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="Tempero, início">
            <Logo />
          </Link>
          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex" aria-label="Principal">
            {MAIN_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={desk}>
                {n.label}
                {n.to === '/lista' && <Badge n={pending} />}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <HeaderSearch />
            <Link
              to="/receitas"
              className="grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-herb-50 xl:hidden"
              aria-label="Pesquisar"
            >
              <Search size={19} />
            </Link>
            <ThemeToggle />
            <Link
              to="/favoritos"
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-herb-50"
              aria-label="Favoritos"
            >
              <Heart size={19} />
              <span className="absolute right-0.5 top-0.5">
                <Badge n={favorites.length} />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main key={pathname} className="page-enter flex-1 pb-24 md:pb-0">
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
          <p className="text-sm font-medium text-muted">
            Made by <span className="font-semibold text-herb-700">Alexandre Cosme</span>
          </p>
        </div>
      </footer>

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="toast-in fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-lift md:bottom-8"
        >
          {toast.msg}
        </div>
      )}

      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-xl md:hidden"
        aria-label="Navegação principal"
      >
        <div className="mx-auto flex max-w-md">
          <NavLink to="/" end className={tab}>
            <Home size={20} /> Início
          </NavLink>
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={tab}>
              <span className="relative">
                <Icon size={20} />
                {to === '/lista' && <Badge n={pending} />}
              </span>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
