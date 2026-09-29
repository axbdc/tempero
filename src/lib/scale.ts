import type { Ingredient } from '../data/types'

/** Lê "4-6 pessoas", "8-10 fatias (…)" → { count: 4, unit: 'pessoas' } */
export function parseServings(servings: string) {
  const m = servings.match(/^(\d+)(?:-\d+)?\s+([a-zà-ú]+)/i)
  if (!m) return { count: 1, unit: 'pessoas' }
  return { count: Number(m[1]), unit: pluralWord(singularWord(m[2].toLowerCase())) }
}

export function servingsLabel(n: number, unit: string) {
  return `${n} ${n === 1 ? singularWord(unit) : unit}`
}

// ---------- plurais em português (casos que aparecem nas receitas) ----------

const PLURAL_EXCEPTIONS: Record<string, string> = { pão: 'pães', 'c.': 'c.' }
const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'com', 'ou', 'em', 'para', 'e', '+'])
const INVARIANT = new Set(['c.', 'sopa', 'chá', 'g', 'ml', 'l', 'cm', 'kg', 'q.b.'])

function pluralSimple(w: string): string {
  if (PLURAL_EXCEPTIONS[w]) return PLURAL_EXCEPTIONS[w]
  if (/ês$/.test(w)) return w.replace(/ês$/, 'eses')
  if (/s$/.test(w)) return w
  if (/ão$/.test(w)) return w.replace(/ão$/, 'ões')
  if (/al$/.test(w)) return w.replace(/al$/, 'ais')
  if (/[rz]$/.test(w)) return w + 'es'
  if (/m$/.test(w)) return w.replace(/m$/, 'ns')
  if (/[aeiouáéíóú]$/.test(w)) return w + 's'
  return w
}

function singularSimple(w: string): string {
  if (w === 'pães') return 'pão'
  if (/ões$/.test(w)) return w.replace(/ões$/, 'ão')
  if (/ais$/.test(w)) return w.replace(/ais$/, 'al')
  if (/eses$/.test(w)) return w.replace(/eses$/, 'ês')
  if (/ns$/.test(w)) return w.replace(/ns$/, 'm')
  if (/[rz]es$/.test(w)) return w.replace(/es$/, '')
  if (/[aeiouáéíóú]s$/.test(w)) return w.replace(/s$/, '')
  return w
}

export function pluralWord(w: string) {
  if (INVARIANT.has(w.toLowerCase())) return w
  return w.split('-').map(pluralSimple).join('-')
}

export function singularWord(w: string) {
  if (INVARIANT.has(w.toLowerCase())) return w
  return w.split('-').map(singularSimple).join('-')
}

/** Aplica a regra a todas as palavras até à primeira preposição ou parêntese. */
function inflectPhrase(phrase: string, plural: boolean) {
  const words = phrase.split(' ')
  let stop = false
  return words
    .map((w) => {
      if (stop || !w || w.startsWith('(') || STOP.has(w.toLowerCase()) || /\d/.test(w)) {
        stop = true
        return w
      }
      return plural ? pluralWord(w) : singularWord(w)
    })
    .join(' ')
}

// ---------- números ----------

const FRACTIONS: [number, string][] = [
  [0.25, '¼'],
  [0.5, '½'],
  [0.75, '¾'],
]

function parseNum(s: string) {
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number)
    return a / b
  }
  return Number(s.replace(',', '.'))
}

function fmt(v: number, integer: boolean, bigUnit: boolean) {
  if (integer) return String(Math.max(1, Math.round(v)))
  if (bigUnit && v >= 20) return String(Math.round(v / 5) * 5)
  if (v >= 10) return String(Math.round(v))
  const q = Math.round(v * 4) / 4
  if (q === 0) return '¼'
  const whole = Math.floor(q)
  const frac = FRACTIONS.find(([f]) => Math.abs(q - whole - f) < 0.01)?.[1]
  if (!frac) return String(whole)
  return whole ? `${whole} ${frac}` : frac
}

const NUM = /(~)?(\d+\/\d+|\d+(?:,\d+)?)(?:-(\d+(?:,\d+)?))?/g

/**
 * Ajusta a quantidade de um ingrediente a um fator (ex.: 2 = dobro).
 * Devolve o ingrediente com quantidade, unidade e nome no singular/plural certo.
 */
export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  if (factor === 1 || !ing.qty || /^(q\.b\.|opcional)/i.test(ing.qty)) return ing

  const integer = /ovo|gema/i.test(ing.item + ' ' + ing.qty)
  const bigUnit = /\b(g|ml|cm)\b/i.test(ing.qty)
  let first: number | null = null
  let firstScaled: number | null = null

  let qty = ing.qty.replace(NUM, (_m, tilde: string | undefined, a: string, b?: string) => {
    const va = parseNum(a) * factor
    if (first === null) {
      first = parseNum(a)
      firstScaled = va
    }
    const out = b ? `${fmt(va, integer, bigUnit)}-${fmt(parseNum(b) * factor, integer, bigUnit)}` : fmt(va, integer, bigUnit)
    return (tilde ?? '') + out
  })

  if (first === null || firstScaled === null) return ing
  const wasPlural = first > 1
  const isPlural = firstScaled > 1

  // Unidade logo a seguir ao número ("1 chávena" → "2 chávenas")
  const unitMatch = qty.match(/^(~?[\d¼½¾ ]+(?:-[\d¼½¾]+)?)\s+([a-zà-ú.]+)(.*)$/i)
  let item = ing.item
  if (unitMatch) {
    if (wasPlural !== isPlural) {
      const [, n, unit, rest] = unitMatch
      qty = `${n.trim()} ${inflectPhrase(`${unit}${rest}`, isPlural)}`
    }
  } else if (wasPlural !== isPlural) {
    // Contagem simples ("1" ovo → "2" ovos): o plural vai para o nome
    item = inflectPhrase(ing.item, isPlural)
  }

  // Notas com números deixam de estar certas depois de escalar
  const note = ing.note && /\d/.test(ing.note) ? undefined : ing.note
  return { ...ing, qty, item, note }
}
