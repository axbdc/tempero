export type CategoryId = 'pequeno-almoco' | 'lanche' | 'almoco' | 'jantar' | 'petiscos'

export interface Category {
  id: CategoryId
  label: string
  short: string
  description: string
}

export interface Ingredient {
  qty?: string
  item: string
  note?: string
}

export interface IngredientGroup {
  group?: string
  items: Ingredient[]
}

export interface Step {
  title: string
  text: string
  /** Minutos para o temporizador deste passo */
  minutes?: number
  /** Lume / forno / micro-ondas — mostrado como etiqueta */
  heat?: string
  tip?: string
}

export interface Variant {
  name: string
  text: string
}

export interface Recipe {
  slug: string
  title: string
  category: CategoryId
  summary: string
  image: string
  credit: string
  totalMin: number
  difficulty: 'Fácil' | 'Média'
  servings: string
  tags: string[]
  ingredients: IngredientGroup[]
  steps: Step[]
  variants?: Variant[]
  tips?: string[]
  /** Receita testada pelo Alex */
  house?: boolean
}
