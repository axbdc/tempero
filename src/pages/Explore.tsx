import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { categories, getCategory, normalize, recipes } from '../data'
import { RecipeCard } from '../components/RecipeCard'

const times = [
  { v: '', label: 'Qualquer tempo' },
  { v: '15', label: 'Até 15 min' },
  { v: '30', label: 'Até 30 min' },
  { v: '45', label: 'Até 45 min' },
]

export function Explore() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const cat = params.get('cat') ?? ''
  const tempo = params.get('tempo') ?? ''

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const nq = normalize(q.trim())
    return recipes.filter((r) => {
      if (cat && r.category !== cat) return false
      if (tempo && r.totalMin > Number(tempo)) return false
      if (!nq) return true
      const hay = normalize(
        [r.title, r.summary, ...r.tags, ...r.ingredients.flatMap((g) => g.items.map((i) => i.item))].join(' '),
      )
      return nq.split(/\s+/).every((w) => hay.includes(w))
    })
  }, [q, cat, tempo])

  const current = getCategory(cat)
  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-herb-700 text-white shadow-soft' : 'bg-paper text-ink ring-1 ring-line hover:bg-herb-50'
    }`

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-herb-900 sm:text-4xl">
        {current ? current.label : 'Todas as receitas'}
      </h1>
      <p className="mt-1 text-muted">{current ? current.description : 'Procura por nome, ingrediente ou etiqueta.'}</p>

      <div className="relative mt-6">
        <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Ex.: frango, natas, forno…"
          aria-label="Pesquisar receitas"
          className="h-13 w-full rounded-2xl border border-line bg-paper pl-12 pr-12 text-[15px] shadow-soft outline-none transition placeholder:text-muted/80 focus:border-herb-500 focus:ring-4 focus:ring-herb-100"
        />
        {q && (
          <button
            onClick={() => set('q', '')}
            aria-label="Limpar pesquisa"
            className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-herb-50"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:flex-wrap sm:px-0">
        <button className={chip(!cat)} onClick={() => set('cat', '')}>
          Todas
        </button>
        {categories.map((c) => (
          <button key={c.id} className={chip(cat === c.id)} onClick={() => set('cat', cat === c.id ? '' : c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 py-2 sm:mx-0 sm:px-0">
        {times.map((t) => (
          <button
            key={t.v}
            onClick={() => set('tempo', t.v)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
              tempo === t.v ? 'bg-saffron-50 text-[#8a5a00] ring-1 ring-saffron' : 'text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-muted">
        {results.length} {results.length === 1 ? 'receita' : 'receitas'}
      </p>

      {results.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((r) => (
            <RecipeCard key={r.slug} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-card bg-paper p-10 text-center ring-1 ring-line">
          <p className="font-semibold">Nada encontrado.</p>
          <p className="mt-1 text-sm text-muted">Tenta outro ingrediente ou limpa os filtros.</p>
          <button
            onClick={() => setParams({}, { replace: true })}
            className="mt-4 rounded-full bg-herb-700 px-5 py-2.5 text-sm font-bold text-white"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}
