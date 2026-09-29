import { useStored } from './storage'

export const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export interface PlanEntry {
  id: string
  slug: string
  doses: number
}

export type Plan = PlanEntry[][]

const EMPTY: Plan = [[], [], [], [], [], [], []]
const uid = () => Math.random().toString(36).slice(2, 10)

/** Índice do dia de hoje (0 = segunda). */
export const todayIndex = () => (new Date().getDay() + 6) % 7

export function usePlan() {
  const [stored, setPlan] = useStored<Plan>('tempero:plano', EMPTY)
  const plan = Array.isArray(stored) && stored.length === 7 ? stored : EMPTY

  const update = (fn: (p: Plan) => void) =>
    setPlan((prev) => {
      const base = Array.isArray(prev) && prev.length === 7 ? prev : EMPTY
      const copy = base.map((d) => [...d])
      fn(copy)
      return copy
    })

  return {
    plan,
    count: plan.reduce((n, d) => n + d.length, 0),
    add: (day: number, slug: string, doses: number) =>
      update((p) => {
        p[day].push({ id: uid(), slug, doses })
      }),
    remove: (day: number, id: string) =>
      update((p) => {
        p[day] = p[day].filter((e) => e.id !== id)
      }),
    setDoses: (day: number, id: string, doses: number) =>
      update((p) => {
        p[day] = p[day].map((e) => (e.id === id ? { ...e, doses: Math.max(1, Math.min(20, doses)) } : e))
      }),
    move: (from: number, id: string, to: number) =>
      update((p) => {
        const e = p[from].find((x) => x.id === id)
        if (!e || from === to) return
        p[from] = p[from].filter((x) => x.id !== id)
        p[to].push(e)
      }),
    clear: () => setPlan(EMPTY),
  }
}
