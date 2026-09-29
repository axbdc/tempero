import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChefHat, Clock, ListChecks, Refrigerator, Scale, ShoppingBasket, Timer } from 'lucide-react'
import { InstallBanner } from '../components/InstallBanner'
import { byCategory, categories, formatTime, getCategory, imageUrl, recipes, type CategoryId } from '../data'
import { RecipeCard } from '../components/RecipeCard'
import { FavoriteButton } from '../components/FavoriteButton'

function mealForNow(): CategoryId {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'pequeno-almoco'
  if (h >= 11 && h < 15) return 'almoco'
  if (h >= 15 && h < 19) return 'lanche'
  if (h >= 19 && h < 23) return 'jantar'
  return 'petiscos'
}

const greeting = () => {
  const h = new Date().getHours()
  if (h >= 5 && h < 13) return 'Bom dia'
  if (h >= 13 && h < 20) return 'Boa tarde'
  return 'Boa noite'
}

const categoryCover: Record<CategoryId, string> = {
  'pequeno-almoco': byCategory('pequeno-almoco')[0].image,
  lanche: byCategory('lanche')[0].image,
  almoco: byCategory('almoco')[0].image,
  jantar: byCategory('jantar')[0].image,
  petiscos: byCategory('petiscos')[0].image,
}

export function Home() {
  const meal = mealForNow()
  const options = byCategory(meal)
  const day = Math.floor(Date.now() / 86_400_000)
  const featured = options[day % options.length]
  const featuredCat = getCategory(featured.category)!
  const quick = recipes.filter((r) => r.totalMin <= 15)

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
        <p className="animate-fade-up text-sm font-semibold text-herb-600">{greeting()}</p>
        <h1 className="animate-fade-up mt-1 font-display text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-herb-900 sm:text-5xl">
          O que vamos cozinhar hoje?
        </h1>

        <Link
          to={`/receita/${featured.slug}`}
          className="group relative mt-6 block overflow-hidden rounded-[28px] bg-herb-900 shadow-lift sm:mt-8"
        >
          <div className="aspect-[4/5] sm:aspect-[21/9]">
            <img
              src={imageUrl(featured.image, 1600, 900)}
              alt={featured.title}
              className="kenburns h-full w-full object-cover opacity-90"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <FavoriteButton slug={featured.slug} className="absolute right-4 top-4 h-11 w-11" size={20} />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-saffron px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#123a2a]">
              Sugestão para o {featuredCat.label.toLowerCase()}
            </span>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
              {featured.title}
            </h2>
            <p className="mt-2 hidden max-w-xl text-white/85 sm:block">{featured.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
                <Clock size={15} /> {formatTime(featured.totalMin)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur">
                <ChefHat size={15} /> {featured.difficulty}
              </span>
              <span className="ml-auto hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#123a2a] transition group-hover:gap-3 sm:inline-flex">
                Ver receita <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* Ferramentas */}
      <section className="reveal mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: '/frigorifico', icon: Refrigerator, t: 'O que tenho no frigorífico?', d: 'Escolhe o que tens e vê o que dá para fazer.' },
            { to: '/plano', icon: CalendarDays, t: 'Planear a semana', d: 'Receitas por dia e lista de compras automática.' },
            { to: '/lista', icon: ShoppingBasket, t: 'Lista de compras', d: 'Ingredientes organizados por secção.' },
          ].map(({ to, icon: Icon, t, d }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-card bg-paper p-4 shadow-soft ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-herb-50 text-herb-700 transition group-hover:scale-105">
                <Icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{t}</span>
                <span className="block text-sm text-muted">{d}</span>
              </span>
              <ArrowRight size={18} className="ml-auto shrink-0 text-muted transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
        <InstallBanner />
      </section>

      {/* Categorias */}
      <section className="reveal mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight">Categorias</h2>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
          {categories.map((c) => (
            <Link key={c.id} to={`/receitas?cat=${c.id}`} className="group w-24 shrink-0 text-center sm:w-auto">
              <div className="mx-auto aspect-square w-24 overflow-hidden rounded-full ring-4 ring-paper shadow-soft transition group-hover:ring-herb-100 sm:w-32">
                <img
                  src={imageUrl(categoryCover[c.id], 300, 300)}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
              </div>
              <p className="mt-2.5 text-sm font-bold text-ink">{c.label}</p>
              <p className="text-xs text-muted">{byCategory(c.id).length} receitas</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Rápidas */}
      <section className="reveal mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Em 15 minutos ou menos</h2>
            <p className="mt-1 text-sm text-muted">Para quando a fome aperta.</p>
          </div>
          <Link to="/receitas?tempo=15" className="shrink-0 text-sm font-bold text-herb-700 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {quick.slice(0, 8).map((r) => (
            <div key={r.slug} className="w-60 shrink-0 snap-start sm:w-auto">
              <RecipeCard recipe={r} compact />
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="reveal mx-auto mt-14 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 rounded-[28px] bg-herb-700 p-6 text-white sm:grid-cols-3 sm:p-10">
          {[
            { icon: Scale, t: 'Sem balança', d: 'Tudo medido em chávenas, colheres e copos de iogurte.' },
            { icon: ListChecks, t: 'Passo a passo', d: 'Um passo de cada vez, em ecrã inteiro, com o ecrã sempre ligado.' },
            { icon: Timer, t: 'Temporizadores', d: 'Cada passo com tempo traz o seu temporizador com alarme.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-4 sm:block">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10">
                <Icon size={21} className="text-saffron" />
              </div>
              <div>
                <h3 className="mt-0 text-base font-bold sm:mt-4">{t}</h3>
                <p className="mt-1 text-sm text-white/75">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Todas */}
      {categories.map((c) => (
        <section key={c.id} className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">{c.label}</h2>
              <p className="mt-1 text-sm text-muted">{c.description}</p>
            </div>
            <Link to={`/receitas?cat=${c.id}`} className="shrink-0 text-sm font-bold text-herb-700 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-4">
            {byCategory(c.id)
              .slice(0, 8)
              .map((r) => (
                <div key={r.slug} className="w-64 shrink-0 snap-start sm:w-auto">
                  <RecipeCard recipe={r} />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
