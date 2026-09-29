import type { Category, CategoryId, Recipe } from './types'
import { pequenoAlmoco, lanche } from './recipes-manha-lanche'
import { almoco, jantar } from './recipes-almoco-jantar'
import { petiscos } from './recipes-petiscos'

export * from './types'

export const categories: Category[] = [
  { id: 'pequeno-almoco', label: 'Pequeno-almoço', short: 'Manhã', description: 'Para começar bem o dia.' },
  { id: 'lanche', label: 'Lanche', short: 'Lanche', description: 'Doces rápidos e salgados para a tarde.' },
  { id: 'almoco', label: 'Almoço', short: 'Almoço', description: 'Pratos completos e marmitas.' },
  { id: 'jantar', label: 'Jantar', short: 'Jantar', description: 'Jantares sem complicações.' },
  { id: 'petiscos', label: 'Petiscos', short: 'Petiscar', description: 'Para partilhar à mesa.' },
]

export const recipes: Recipe[] = [...pequenoAlmoco, ...lanche, ...almoco, ...jantar, ...petiscos]

export const getRecipe = (slug: string) => recipes.find((r) => r.slug === slug)
export const getCategory = (id: CategoryId | string) => categories.find((c) => c.id === id)
export const byCategory = (id: CategoryId) => recipes.filter((r) => r.category === id)

export const imageUrl = (id: string, w = 1200, h?: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=75`

export const formatTime = (min: number) => {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m}` : `${h} h`
}

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
