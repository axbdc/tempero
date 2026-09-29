import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, RotateCcw } from 'lucide-react'
import { formatTime, getCategory, imageUrl, normalize, recipes } from '../data'
import { useStored } from '../lib/storage'

const PANTRY: { id: string; label: string; kw: string[] }[] = [
  { id: 'ovos', label: 'Ovos', kw: ['ovo', 'ovos', 'gemas'] },
  { id: 'frango', label: 'Frango', kw: ['frango', 'asas', 'coxas'] },
  { id: 'carne-picada', label: 'Carne picada', kw: ['carne picada'] },
  { id: 'vaca', label: 'Bifes de vaca', kw: ['vaca', 'novilho'] },
  { id: 'bacon', label: 'Bacon', kw: ['bacon'] },
  { id: 'chourico', label: 'Chouriço', kw: ['chouri'] },
  { id: 'fiambre', label: 'Fiambre', kw: ['fiambre'] },
  { id: 'atum', label: 'Atum', kw: ['atum'] },
  { id: 'bacalhau', label: 'Bacalhau', kw: ['bacalhau'] },
  { id: 'salmao', label: 'Salmão', kw: ['salm'] },
  { id: 'camarao', label: 'Camarão', kw: ['camar'] },
  { id: 'queijo', label: 'Queijo', kw: ['queijo', 'mozzarella', 'parmes'] },
  { id: 'leite', label: 'Leite', kw: ['leite'] },
  { id: 'natas', label: 'Natas', kw: ['natas'] },
  { id: 'iogurte', label: 'Iogurte', kw: ['iogurte'] },
  { id: 'manteiga', label: 'Manteiga', kw: ['manteiga'] },
  { id: 'batata', label: 'Batatas', kw: ['batata', 'batatas'] },
  { id: 'cebola', label: 'Cebola', kw: ['cebola', 'cebolas'] },
  { id: 'alho', label: 'Alho', kw: ['alho', 'dente de alho', 'dentes de alho'] },
  { id: 'tomate', label: 'Tomate', kw: ['tomate', 'tomates'] },
  { id: 'cogumelos', label: 'Cogumelos', kw: ['cogumelo'] },
  { id: 'cenoura', label: 'Cenoura', kw: ['cenoura'] },
  { id: 'abacate', label: 'Abacate', kw: ['abacate'] },
  { id: 'banana', label: 'Banana', kw: ['banana'] },
  { id: 'limao', label: 'Limão ou lima', kw: ['limao', 'lima'] },
  { id: 'arroz', label: 'Arroz', kw: ['arroz'] },
  { id: 'massa', label: 'Massa', kw: ['esparguete', 'massa', 'lasanha'] },
  { id: 'pao', label: 'Pão', kw: ['pao', 'baguete', 'tortilhas', 'tortilha'] },
  { id: 'farinha', label: 'Farinha', kw: ['farinha'] },
  { id: 'aveia', label: 'Aveia', kw: ['aveia'] },
  { id: 'grao', label: 'Grão', kw: ['grao'] },
  { id: 'chocolate', label: 'Chocolate', kw: ['chocolate', 'cacau'] },
]

// Coisas que se assume que há sempre em casa
const BASICS = ['sal', 'pimenta', 'azeite', 'oleo', 'agua', 'acucar', 'louro', 'oregaos', 'canela']

const words = (t: string) => ' ' + normalize(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' '
const NONE: string[] = []

export function Fridge() {
  const [selected, setSelected] = useStored<string[]>('tempero:frigorifico', NONE)
  const chosen = PANTRY.filter((p) => selected.includes(p.id))

  const results = useMemo(() => {
    if (!chosen.length) return []
    return recipes
      .map((r) => {
        const items = r.ingredients
          .flatMap((g) => g.items)
          .filter((i) => {
            const t = words(i.item)
            return !BASICS.some((b) => t.startsWith(' ' + b + ' ')) && !/^q\.b\./.test(i.qty ?? '')
          })
        const have = items.filter((i) => {
          const t = words(i.item)
          return chosen.some((c) => c.kw.some((k) => t.includes(' ' + k)))
        })
        const missing = items.filter((i) => !have.includes(i))
        return { r, have: have.length, total: items.length, missing }
      })
      .filter((x) => x.have > 0)
      .sort((a, b) => b.have / b.total - a.have / a.total || b.have - a.have)
  }, [chosen])

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-herb-900 sm:text-4xl">O que tenho no frigorífico?</h1>
      <p className="mt-1 text-muted">Toca no que tens em casa. Sal, azeite, açúcar e especiarias básicas contam como tendo.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {PANTRY.map((p) => {
          const on = selected.includes(p.id)
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                on ? 'bg-herb-700 text-white shadow-soft' : 'bg-paper text-ink ring-1 ring-line hover:bg-herb-50'
              }`}
            >
              {on && <Check size={14} strokeWidth={3} />}
              {p.label}
            </button>
          )
        })}
        {selected.length > 0 && (
          <button
            onClick={() => setSelected(NONE)}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <RotateCcw size={14} /> Limpar
          </button>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="mt-10 rounded-card bg-paper p-10 text-center ring-1 ring-line">
          <p className="font-semibold">Escolhe pelo menos um ingrediente.</p>
          <p className="mt-1 text-sm text-muted">As receitas que dá para fazer aparecem aqui, das mais completas para as menos.</p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm font-medium text-muted">
            {results.length} {results.length === 1 ? 'receita usa' : 'receitas usam'} o que tens
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ r, have, total, missing }) => {
              const pct = Math.round((have / total) * 100)
              return (
                <Link
                  key={r.slug}
                  to={`/receita/${r.slug}`}
                  className="reveal group flex gap-4 rounded-card bg-paper p-3 shadow-soft ring-1 ring-line/60 transition hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <img src={imageUrl(r.image, 240, 240)} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-herb-600">{getCategory(r.category)?.label}</p>
                    <h3 className="truncate font-bold">{r.title}</h3>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
                      <div className="h-full rounded-full bg-herb-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Tens {have} de {total} ingredientes · <Clock size={11} className="inline" /> {formatTime(r.totalMin)}
                    </p>
                    {missing.length > 0 && (
                      <p className="mt-1 truncate text-xs text-ink/70">
                        Falta: {missing.slice(0, 3).map((m) => m.item.split(' (')[0]).join(', ')}
                        {missing.length > 3 ? '…' : ''}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
