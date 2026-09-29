import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, GripVertical, Minus, Plus, ShoppingBasket, X } from 'lucide-react'
import { getRecipe, imageUrl } from '../data'
import { DAYS, todayIndex, usePlan } from '../lib/plan'
import { useShopping } from '../lib/shopping'
import { parseServings } from '../lib/scale'
import { toast } from '../lib/toast'
import { RecipePicker } from '../components/RecipePicker'

export function Planner() {
  const plan = usePlan()
  const shop = useShopping()
  const navigate = useNavigate()
  const [pickDay, setPickDay] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const today = todayIndex()

  const generate = () => {
    // Soma as doses da mesma receita em dias diferentes
    const totals = new Map<string, number>()
    for (const day of plan.plan) for (const e of day) totals.set(e.slug, (totals.get(e.slug) ?? 0) + e.doses)
    let n = 0
    for (const [slug, doses] of totals) {
      const r = getRecipe(slug)
      if (!r) continue
      n += shop.addRecipe(r, doses / parseServings(r.servings).count)
    }
    toast(`${n} ingredientes na lista de compras`)
    navigate('/lista')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-herb-900 sm:text-4xl">Plano da semana</h1>
          <p className="mt-1 text-muted">Escolhe o que cozinhar em cada dia. Arrasta as receitas para mudar de dia.</p>
        </div>
        <div className="flex gap-2">
          {plan.count > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Limpar o plano da semana?')) plan.clear()
              }}
              className="h-11 rounded-full px-4 text-sm font-semibold text-muted ring-1 ring-line hover:text-ink"
            >
              Limpar
            </button>
          )}
          <button
            onClick={generate}
            disabled={!plan.count}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-herb-700 px-5 text-sm font-bold text-white shadow-soft transition hover:bg-herb-600 disabled:opacity-40"
          >
            <ShoppingBasket size={17} /> Gerar lista de compras
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plan.plan.map((entries, day) => (
          <section
            key={day}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(day)
            }}
            onDragLeave={() => setDragOver((d) => (d === day ? null : d))}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(null)
              try {
                const { from, id } = JSON.parse(e.dataTransfer.getData('text/plain')) as { from: number; id: string }
                plan.move(from, id, day)
              } catch {
                /* ignorar */
              }
            }}
            className={`reveal flex flex-col rounded-card bg-paper p-4 ring-1 transition ${
              dragOver === day ? 'ring-2 ring-herb-500 bg-herb-50' : day === today ? 'ring-herb-300' : 'ring-line/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold">
                {DAYS[day]}
                {day === today && <span className="ml-2 rounded-full bg-saffron px-2 py-0.5 text-[10px] font-bold uppercase text-[#123a2a]">Hoje</span>}
              </h2>
              <span className="text-xs text-muted">{entries.length || ''}</span>
            </div>
            <ul className="mt-3 flex-1 space-y-2">
              {entries.map((e) => {
                const r = getRecipe(e.slug)
                if (!r) return null
                return (
                  <li
                    key={e.id}
                    draggable
                    onDragStart={(ev) => ev.dataTransfer.setData('text/plain', JSON.stringify({ from: day, id: e.id }))}
                    className="animate-fade-up group flex items-center gap-2 rounded-2xl bg-cream p-2"
                  >
                    <GripVertical size={15} className="hidden shrink-0 cursor-grab text-muted sm:block" />
                    <img src={imageUrl(r.image, 120, 120)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/receita/${r.slug}?doses=${e.doses}`} className="block truncate text-sm font-bold hover:underline">
                        {r.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          onClick={() => plan.setDoses(day, e.id, e.doses - 1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-paper text-herb-700 ring-1 ring-line"
                          aria-label="Menos uma dose"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[4.5rem] text-center text-xs font-semibold tabular-nums">
                          {e.doses} {e.doses === 1 ? 'dose' : 'doses'}
                        </span>
                        <button
                          onClick={() => plan.setDoses(day, e.id, e.doses + 1)}
                          className="grid h-6 w-6 place-items-center rounded-full bg-paper text-herb-700 ring-1 ring-line"
                          aria-label="Mais uma dose"
                        >
                          <Plus size={12} />
                        </button>
                        <select
                          value={day}
                          onChange={(ev) => plan.move(day, e.id, Number(ev.target.value))}
                          className="ml-auto h-6 rounded-full bg-paper px-1.5 text-[11px] font-semibold text-muted ring-1 ring-line outline-none"
                          aria-label="Mudar de dia"
                        >
                          {DAYS.map((d, i) => (
                            <option key={d} value={i}>
                              {d.slice(0, 3)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => plan.remove(day, e.id)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink"
                      aria-label="Remover"
                    >
                      <X size={15} />
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              onClick={() => setPickDay(day)}
              className="mt-3 inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-dashed border-herb-300 text-sm font-semibold text-herb-700 transition hover:bg-herb-50"
            >
              <Plus size={16} /> Adicionar receita
            </button>
          </section>
        ))}
      </div>

      {plan.count === 0 && (
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
          <CalendarDays size={16} /> Também podes adicionar ao plano a partir de qualquer receita.
        </p>
      )}

      {pickDay !== null && (
        <RecipePicker
          title={`Adicionar a ${DAYS[pickDay].toLowerCase()}`}
          onClose={() => setPickDay(null)}
          onPick={(slug) => {
            const r = getRecipe(slug)
            if (r) plan.add(pickDay, slug, parseServings(r.servings).count)
            setPickDay(null)
          }}
        />
      )}
    </div>
  )
}
