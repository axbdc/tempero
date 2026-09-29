import type { Recipe } from '../data/types'
import { normalize } from '../data'
import { scaleIngredient } from './scale'
import { useStored } from './storage'

export type SectionId = 'legumes' | 'talho' | 'laticinios' | 'padaria' | 'mercearia' | 'congelados'

export const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'legumes', label: 'Frutas e legumes' },
  { id: 'talho', label: 'Talho e peixaria' },
  { id: 'laticinios', label: 'Laticínios e ovos' },
  { id: 'padaria', label: 'Padaria' },
  { id: 'mercearia', label: 'Mercearia' },
  { id: 'congelados', label: 'Congelados' },
]

// A primeira regra que encaixa ganha (ex.: "tomate pelado" vai para mercearia, não para legumes)
const RULES: [SectionId, string[]][] = [
  ['congelados', ['congelad']],
  [
    'mercearia',
    ['lata', 'polpa', 'pelado', 'concentrado', 'atum', 'leite de coco', 'caldo', 'cubo', 'molho', 'azeitona', 'grao', 'tahini', 'pickles', 'nachos', 'lasanha', 'chocolate', 'cacau', 'granola', 'flocos', 'arroz', 'esparguete', 'penne', 'alho em po'],
  ],
  ['talho', ['frango', 'carne', 'bife', 'bacon', 'chouri', 'fiambre', 'bacalhau', 'salm', 'camar', 'peixe', 'asas', 'coxas', 'pernas', 'peito', 'lombo', 'vaca']],
  ['laticinios', ['ovo', 'gema', 'leite', 'natas', 'manteiga', 'queijo', 'iogurte', 'mozzarella', 'parmes', 'massa quebrada']],
  ['padaria', ['pao', 'paes', 'baguete', 'tortilha', 'brioche', 'ciabatta']],
  [
    'legumes',
    ['cebola', 'alho', 'tomate', 'batata', 'cenoura', 'cogumelo', 'abacate', 'limao', 'lima', 'banana', 'morango', 'mirtilo', 'fruta', 'frutos', 'salsa', 'coentros', 'cebolinho', 'manjericao', 'alface', 'pimento', 'brocolo', 'curgete', 'abobora', 'espargo', 'pepino', 'gengibre', 'malagueta', 'alecrim', 'tomilho', 'laranja', 'ervas'],
  ],
]

/** Texto normalizado, só letras e números, com espaços à volta (para procurar início de palavra). */
const words = (text: string) => ' ' + normalize(text).replace(/[^a-z0-9]+/g, ' ').trim() + ' '

export function sectionOf(text: string): SectionId {
  const t = words(text)
  for (const [id, kws] of RULES) if (kws.some((k) => t.includes(' ' + k))) return id
  return 'mercearia'
}

export interface ShopItem {
  id: string
  text: string
  qty?: string
  slug?: string
  recipe?: string
  section: SectionId
  done: boolean
}

const NONE: ShopItem[] = []
const uid = () => Math.random().toString(36).slice(2, 10)

export function useShopping() {
  const [items, setItems] = useStored<ShopItem[]>('tempero:lista', NONE)

  /** Junta os ingredientes de uma receita (substitui os que já lá estavam dessa receita). */
  const addRecipe = (r: Recipe, factor = 1) => {
    const add: ShopItem[] = []
    for (const g of r.ingredients)
      for (const i of g.items) {
        if (words(i.item).startsWith(' agua ')) continue
        const s = scaleIngredient(i, factor)
        add.push({
          id: uid(),
          text: s.item,
          qty: s.qty,
          slug: r.slug,
          recipe: r.title,
          section: sectionOf(`${s.qty ?? ''} ${s.item}`),
          done: false,
        })
      }
    setItems((prev) => [...prev.filter((x) => x.slug !== r.slug), ...add])
    return add.length
  }

  return {
    items,
    addRecipe,
    addText: (text: string) =>
      setItems((prev) => [...prev, { id: uid(), text, section: sectionOf(text), done: false }]),
    toggle: (id: string) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x))),
    remove: (id: string) => setItems((prev) => prev.filter((x) => x.id !== id)),
    clearDone: () => setItems((prev) => prev.filter((x) => !x.done)),
    clearAll: () => setItems(NONE),
    pending: items.filter((x) => !x.done).length,
  }
}
