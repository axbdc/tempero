import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChefHat, Clock, Flame, Lightbulb, Play, Share2, Timer, Users } from 'lucide-react'
import { byCategory, formatTime, getCategory, getRecipe, imageUrl } from '../data'
import { FavoriteButton } from '../components/FavoriteButton'
import { RecipeCard } from '../components/RecipeCard'
import { NotFound } from './NotFound'
import { ServingsStepper, useServings } from '../components/ServingsStepper'

export function formatStepTime(min: number) {
  if (min < 1) return `${Math.round(min * 60)} s`
  if (!Number.isInteger(min)) {
    const m = Math.floor(min)
    const s = Math.round((min - m) * 60)
    return `${m} min ${s} s`
  }
  return `${min} min`
}

export function RecipePage() {
  const { slug = '' } = useParams()
  const recipe = getRecipe(slug)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [shared, setShared] = useState(false)
  const navigate = useNavigate()
  const sv = useServings(recipe)

  if (!recipe) return <NotFound />
  const cat = getCategory(recipe.category)!
  const related = byCategory(recipe.category).filter((r) => r.slug !== recipe.slug).slice(0, 3)
  const totalItems = recipe.ingredients.reduce((n, g) => n + g.items.length, 0)

  const toggle = (key: string) =>
    setChecked((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: recipe.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <article>
      {/* Hero */}
      <div className="mx-auto max-w-6xl sm:px-6 sm:pt-8">
        <div className="grid gap-0 sm:gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div className="relative overflow-hidden sm:rounded-[28px]">
            <img
              src={imageUrl(recipe.image, 1400, 1050)}
              alt={recipe.title}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:hidden">
              <button
                onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft"
                aria-label="Voltar"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="flex gap-2">
                <button onClick={share} className="grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft" aria-label="Partilhar">
                  <Share2 size={18} />
                </button>
                <FavoriteButton slug={recipe.slug} className="h-10 w-10" />
              </div>
            </div>
          </div>

          <div className="relative -mt-6 rounded-t-[28px] bg-cream px-5 pt-6 sm:mt-0 sm:rounded-none sm:bg-transparent sm:px-0 sm:pt-0">
            <Link
              to={`/receitas?cat=${cat.id}`}
              className="text-xs font-bold uppercase tracking-[0.1em] text-herb-600 hover:underline"
            >
              {cat.label}
            </Link>
            <h1 className="mt-2 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-herb-900 sm:text-5xl">
              {recipe.title}
            </h1>
            <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{recipe.summary}</p>

            <dl className="mt-6 grid grid-cols-3 divide-x divide-line rounded-2xl bg-paper py-4 text-center shadow-soft ring-1 ring-line/60">
              <div className="px-2">
                <dt className="flex justify-center text-herb-600">
                  <Clock size={19} />
                </dt>
                <dd className="mt-1.5 text-sm font-bold">{formatTime(recipe.totalMin)}</dd>
                <dd className="text-[11px] text-muted">Tempo total</dd>
              </div>
              <div className="px-2">
                <dt className="flex justify-center text-herb-600">
                  <ChefHat size={19} />
                </dt>
                <dd className="mt-1.5 text-sm font-bold">{recipe.difficulty}</dd>
                <dd className="text-[11px] text-muted">Dificuldade</dd>
              </div>
              <div className="px-2">
                <dt className="flex justify-center text-herb-600">
                  <Users size={19} />
                </dt>
                <dd className="mt-1.5 text-sm font-bold leading-tight">{sv.label}</dd>
                <dd className="text-[11px] text-muted">Doses</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-center gap-3">
              <Link
                to={`/receita/${recipe.slug}/cozinhar${sv.query}`}
                className="inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-full bg-herb-700 px-7 text-base font-bold text-white shadow-lift transition hover:bg-herb-600 active:scale-[0.98] sm:flex-none"
              >
                <Play size={19} className="fill-white" /> Começar a cozinhar
              </Link>
              <button
                onClick={share}
                className="hidden h-14 w-14 place-items-center rounded-full bg-paper ring-1 ring-line transition hover:bg-herb-50 sm:grid"
                aria-label="Partilhar"
              >
                {shared ? <Check size={20} className="text-herb-600" /> : <Share2 size={20} />}
              </button>
              <FavoriteButton slug={recipe.slug} className="hidden h-14 w-14 ring-1 ring-line sm:grid" size={21} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.tags.map((t) => (
                <Link
                  key={t}
                  to={`/receitas?q=${encodeURIComponent(t)}`}
                  className="rounded-full bg-herb-50 px-3 py-1 text-xs font-semibold text-herb-700 hover:bg-herb-100"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto mt-10 grid max-w-6xl gap-10 px-5 sm:px-6 lg:mt-16 lg:grid-cols-[340px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-card bg-paper p-5 shadow-soft ring-1 ring-line/60 sm:p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Ingredientes</h2>
              <span className="text-xs font-medium text-muted">
                {checked.size}/{totalItems}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-cream px-3 py-2">
              <span className="text-sm font-semibold text-muted">Doses</span>
              <ServingsStepper count={sv.count} unit={sv.base.unit} onChange={sv.setCount} />
            </div>
            {sv.factor !== 1 && (
              <p className="mt-2 text-xs leading-relaxed text-herb-700">
                Quantidades ajustadas para {sv.label}. A receita original é para {sv.baseLabel}; os tempos mantêm-se.
              </p>
            )}
            {sv.ingredients.map((g, gi) => (
              <div key={gi} className="mt-4">
                {g.group && <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-herb-600">{g.group}</h3>}
                <ul className="divide-y divide-line/70">
                  {g.items.map((it, ii) => {
                    const key = `${gi}-${ii}`
                    const on = checked.has(key)
                    return (
                      <li key={key}>
                        <button
                          onClick={() => toggle(key)}
                          className="flex w-full items-start gap-3 py-2.5 text-left"
                          aria-pressed={on}
                        >
                          <span
                            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${
                              on ? 'border-herb-600 bg-herb-600 text-white' : 'border-line'
                            }`}
                          >
                            {on && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span className={`text-[14.5px] leading-snug transition ${on ? 'text-muted line-through' : ''}`}>
                            {it.qty && <strong className="font-bold">{it.qty} </strong>}
                            {it.item}
                            {it.note && <span className="block text-xs text-muted">{it.note}</span>}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <p className="mt-4 rounded-xl bg-cream p-3 text-xs leading-relaxed text-muted">
              <strong className="text-ink">Medidas:</strong> 1 chávena ≈ 240 ml (caneca de chá). c. sopa = colher de sopa, c. chá =
              colher de chá, q.b. = quanto baste.
            </p>
          </div>
        </aside>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Preparação</h2>
            <span className="text-sm text-muted">{recipe.steps.length} passos</span>
          </div>
          <ol className="mt-4 space-y-3">
            {recipe.steps.map((s, i) => (
              <li key={i} className="flex gap-4 rounded-card bg-paper p-5 ring-1 ring-line/60">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-herb-50 text-sm font-bold text-herb-700">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{s.title}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink/85">{s.text}</p>
                  {(s.heat || s.minutes) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.minutes && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-herb-50 px-2.5 py-1 text-xs font-bold text-herb-700">
                          <Timer size={13} /> {formatStepTime(s.minutes)}
                        </span>
                      )}
                      {s.heat && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-50 px-2.5 py-1 text-xs font-bold text-[#8a5a00]">
                          <Flame size={13} /> {s.heat}
                        </span>
                      )}
                    </div>
                  )}
                  {s.tip && (
                    <p className="mt-3 flex gap-2 rounded-xl bg-cream p-3 text-[13.5px] leading-relaxed text-ink/80">
                      <Lightbulb size={16} className="mt-0.5 shrink-0 text-saffron" />
                      {s.tip}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>

          {recipe.variants && (
            <div className="mt-8">
              <h2 className="text-lg font-bold">Variações</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {recipe.variants.map((v) => (
                  <div key={v.name} className="rounded-card border border-dashed border-herb-300 bg-herb-50/60 p-5">
                    <h3 className="font-bold text-herb-900">{v.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/80">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recipe.tips && (
            <div className="mt-8 rounded-card bg-saffron-50 p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <Lightbulb size={18} className="text-[#c58a12]" /> Dicas
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink/80">
                {recipe.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to={`/receita/${recipe.slug}/cozinhar${sv.query}`}
            className="mt-8 flex h-14 items-center justify-center gap-2.5 rounded-full bg-herb-700 text-base font-bold text-white transition hover:bg-herb-600"
          >
            <Play size={19} className="fill-white" /> Começar a cozinhar
          </Link>
          <p className="mt-3 text-center text-xs text-muted">Foto: {recipe.credit} / Unsplash</p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-5 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight">Mais em {cat.label.toLowerCase()}</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RecipeCard key={r.slug} recipe={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
