import { useSearchParams } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import type { Recipe } from '../data'
import { parseServings, scaleIngredient, servingsLabel } from '../lib/scale'

const MAX = 20

/** Doses escolhidas (guardadas no URL como ?doses=N) e ingredientes ajustados. */
// eslint-disable-next-line react-refresh/only-export-components
export function useServings(recipe: Recipe | undefined) {
  const [params, setParams] = useSearchParams()
  const base = recipe ? parseServings(recipe.servings) : { count: 1, unit: 'pessoas' }
  const raw = Number(params.get('doses'))
  const count = raw >= 1 && raw <= MAX ? Math.round(raw) : base.count
  const factor = count / base.count

  const setCount = (n: number) => {
    const next = new URLSearchParams(params)
    const v = Math.min(MAX, Math.max(1, n))
    if (v === base.count) next.delete('doses')
    else next.set('doses', String(v))
    setParams(next, { replace: true })
  }

  const ingredients = recipe
    ? recipe.ingredients.map((g) => ({ ...g, items: g.items.map((i) => scaleIngredient(i, factor)) }))
    : []

  return {
    count,
    base,
    factor,
    setCount,
    ingredients,
    label: servingsLabel(count, base.unit),
    baseLabel: servingsLabel(base.count, base.unit),
    query: count === base.count ? '' : `?doses=${count}`,
  }
}

interface Props {
  count: number
  unit: string
  onChange: (n: number) => void
  size?: 'sm' | 'lg'
}

export function ServingsStepper({ count, unit, onChange, size = 'sm' }: Props) {
  const lg = size === 'lg'
  const btn = `grid place-items-center rounded-full bg-herb-50 text-herb-700 transition hover:bg-herb-100 active:scale-95 disabled:opacity-30 ${
    lg ? 'h-12 w-12' : 'h-9 w-9'
  }`
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label="Número de doses">
      <button type="button" className={btn} onClick={() => onChange(count - 1)} disabled={count <= 1} aria-label="Menos uma dose">
        <Minus size={lg ? 20 : 16} strokeWidth={2.5} />
      </button>
      <span className={`min-w-[5.5rem] text-center font-bold tabular-nums ${lg ? 'text-xl' : 'text-[15px]'}`} aria-live="polite">
        {servingsLabel(count, unit)}
      </span>
      <button type="button" className={btn} onClick={() => onChange(count + 1)} disabled={count >= MAX} aria-label="Mais uma dose">
        <Plus size={lg ? 20 : 16} strokeWidth={2.5} />
      </button>
    </div>
  )
}
