import type { Recipe } from '../data/types'
import { normalize } from '../data'

export const FILTERS = [
  { id: 'vegetariano', label: 'Vegetariano' },
  { id: 'sem-forno', label: 'Sem forno' },
  { id: 'principiantes', label: 'Para principiantes' },
  { id: 'economico', label: 'Económico' },
  { id: 'marmita', label: 'Para marmita' },
] as const

export type FilterId = (typeof FILTERS)[number]['id']

const MEAT_FISH = ['frango', 'carne', 'bife', 'bacon', 'chouri', 'fiambre', 'atum', 'bacalhau', 'salm', 'camar', 'peixe', 'asas', 'coxas', 'pernas', 'vaca', 'novilho', 'presunto']

const ECONOMICO = new Set([
  'panquecas-fofas', 'ovos-mexidos-cremosos', 'papas-de-aveia-banana', 'rabanadas-pequeno-almoco', 'omelete-queijo-fiambre',
  'overnight-oats', 'crepes-simples', 'panquecas-banana-aveia', 'bolo-de-iogurte', 'bolo-de-caneca-chocolate', 'tosta-mista',
  'muffins-banana', 'hummus-caseiro', 'frango-arroz-tomate', 'esparguete-bolonhesa', 'salada-grao-atum', 'massa-atum-tomate',
  'arroz-de-frango', 'frango-assado-batatas', 'esparguete-natas-cogumelos', 'sopa-creme-legumes', 'tortilha-batata',
  'caril-frango', 'pizza-caseira', 'pao-de-alho', 'batatas-paprica-alho', 'bruschetta-tomate', 'cogumelos-salteados',
])

const MARMITA = new Set([
  'salada-grao-atum', 'arroz-de-frango', 'caril-frango', 'esparguete-bolonhesa', 'lasanha-bolonhesa', 'frango-arroz-tomate',
  'massa-atum-tomate', 'wrap-frango', 'tortilha-batata', 'quiche-bacon-chourico', 'overnight-oats', 'sopa-creme-legumes',
  'wok-frango-legumes', 'frango-assado-batatas', 'hummus-caseiro',
])

const cache = new Map<string, Set<FilterId>>()

export function recipeFlags(r: Recipe): Set<FilterId> {
  const hit = cache.get(r.slug)
  if (hit) return hit
  const flags = new Set<FilterId>()
  const text = ' ' + normalize(r.ingredients.flatMap((g) => g.items.map((i) => i.item)).join(' ')).replace(/[^a-z0-9]+/g, ' ')
  if (!MEAT_FISH.some((m) => text.includes(' ' + m))) flags.add('vegetariano')
  if (!r.steps.some((s) => (s.heat ?? '').toLowerCase().includes('forno'))) flags.add('sem-forno')
  if (r.difficulty === 'Fácil' && r.totalMin <= 30) flags.add('principiantes')
  if (ECONOMICO.has(r.slug)) flags.add('economico')
  if (MARMITA.has(r.slug)) flags.add('marmita')
  cache.set(r.slug, flags)
  return flags
}
