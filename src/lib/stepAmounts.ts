import type { Ingredient, Recipe } from '../data/types'
import { normalize } from '../data'
import { scaleIngredient } from './scale'
import { stepOverrides } from '../data/stepOverrides'

/** Pedaço de texto de um passo; `amount` é a quantidade a mostrar logo a seguir a esse pedaço. */
export interface Segment {
  text: string
  amount?: string
}

export interface AnnotatedStep {
  segments: Segment[]
  /** Lista de quantidades para passos do tipo "junta tudo" (vem de stepOverrides). */
  list?: string[]
}

const STOP = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'as', 'os', 'ja', 'bem', 'tipo'])

// Palavras que são "recipientes": a palavra importante vem a seguir ao "de"
const CONTAINER = new Set([
  'dente', 'dentes', 'peito', 'peitos', 'pernas', 'coxas', 'bifes', 'lombos', 'postas', 'asas', 'molho', 'massa', 'flocos',
  'sementes', 'essencia', 'pepitas', 'pedacos', 'raspa', 'cubo', 'rolo', 'folhas',
])

const SYNONYMS: Record<string, string[]> = {
  vaca: ['carne', 'bifes', 'bife'],
  novilho: ['carne', 'bifes', 'bife'],
  baguete: ['pao'],
  mozzarella: ['queijo'],
  parmesao: ['queijo'],
  esparguete: ['massa'],
  penne: ['massa'],
  tablete: ['chocolate'],
  lasanha: ['massa'],
}

const CUT = /\s(em|com|para|ao|a ferver)\s/

const toWords = (t: string) =>
  normalize(t)
    .replace(/[^a-z0-9-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

function sameWord(a: string, b: string) {
  if (a === b) return true
  if (a + 's' === b || b + 's' === a) return true
  if (a + 'es' === b || b + 'es' === a) return true
  if (a.endsWith('ao') && b === a.slice(0, -2) + 'oes') return true
  if (b.endsWith('ao') && a === b.slice(0, -2) + 'oes') return true
  return false
}

/** Palavras-chave de um ingrediente: palavra principal (+ "de X" para recipientes) e alternativas "ou". */
export function ingredientKeys(item: string): string[] {
  const keys = new Set<string>()
  const base = normalize(item.split('(')[0])
  for (const alt of base.split(/\s+ou\s+|,\s*/)) {
    const w = toWords(alt.split(CUT)[0]).filter((x) => !STOP.has(x) && !/\d/.test(x))
    const orig = toWords(alt)
    let head = w[0]
    if (!head) continue
    keys.add(head)
    for (const s of SYNONYMS[head] ?? []) keys.add(s)
    // "dentes de alho" -> alho; "bifes de peito de frango" -> peito -> frango
    let pos = orig.indexOf(head)
    while (CONTAINER.has(head) && pos >= 0) {
      const next = orig.slice(pos + 1).find((x) => !STOP.has(x))
      if (!next) break
      keys.add(next)
      for (const s of SYNONYMS[next] ?? []) keys.add(s)
      pos = orig.indexOf(next, pos + 1)
      head = next
    }
  }
  return [...keys].filter((k) => k.length >= 3)
}

const hasQty = (i: Ingredient) => !!i.qty && !/^(q\.b\.|opcional)/i.test(i.qty)

const PRETTY: [RegExp, string][] = [
  [/(^|\s)1\/2(?=\s|$)/g, '$1½'],
  [/(^|\s)1\/4(?=\s|$)/g, '$1¼'],
  [/(^|\s)3\/4(?=\s|$)/g, '$1¾'],
  [/(^|\s)1\/3(?=\s|$)/g, '$1⅓'],
  [/(^|\s)(\d+),5(?=\s|$)/g, '$1$2 ½'],
  [/(^|\s)(\d+),25(?=\s|$)/g, '$1$2 ¼'],
]

/** "1/2 chávena" -> "½ chávena", "1,5 chávenas" -> "1 ½ chávenas" */
export function prettyQty(q: string) {
  let out = q
  for (const [re, rep] of PRETTY) out = out.replace(re, rep)
  return out
}

const qtyOf = (ing: Ingredient, factor: number) => prettyQty(scaleIngredient(ing, factor).qty ?? '')

/**
 * Junta a quantidade (já ajustada às doses) a seguir à primeira menção de cada ingrediente
 * nos passos. "metade/meia do X" e "resto do X" mostram metade de cada vez; se o texto já
 * tem a quantidade ("3 c. sopa de azeite"), não repete.
 */
export function annotateSteps(recipe: Recipe, factor: number): AnnotatedStep[] {
  const groups = recipe.ingredients
  const ings = groups.flatMap((g, gi) => g.items.map((i) => ({ ing: i, group: gi })))
  const keys = ings.map((x) => ingredientKeys(x.ing.item))
  const phrases = ings.map((x) => toWords(x.ing.item.split('(')[0]).join(' '))
  const used = new Map<number, 'full' | 'half'>()
  const overrides = stepOverrides[recipe.slug] ?? {}

  return recipe.steps.map((step, si) => {
    const ov = overrides[si]
    const skip = new Set(ov?.skip ?? [])
    const tokens: { w: string; start: number; end: number }[] = []
    const re = /[A-Za-zÀ-ÿ0-9-]+/g
    let m: RegExpExecArray | null
    while ((m = re.exec(step.text))) tokens.push({ w: normalize(m[0]), start: m.index, end: m.index + m[0].length })
    const stepWords = tokens.map((t) => t.w)
    const stepText = ' ' + stepWords.join(' ') + ' '

    // Quantos ingredientes de cada grupo aparecem neste passo (ajuda a escolher o "alho" certo)
    const groupScore = groups.map((_, gi) =>
      ings.filter((x, ii) => x.group === gi && keys[ii].some((k) => stepWords.some((w) => sameWord(k, w)))).length,
    )

    const inserts: { at: number; amount: string }[] = []
    const seenHere = new Set<number>()

    tokens.forEach((tok, ti) => {
      if (skip.has(tok.w)) return
      const cands = ings
        .map((x, ii) => ({ x, ii }))
        .filter(({ ii }) => !seenHere.has(ii) && keys[ii].some((k) => sameWord(k, tok.w)))
        .filter(({ x, ii }) => !hasQty(x.ing) || used.get(ii) !== 'full')
      if (!cands.length) return
      const score = ({ x, ii }: { x: (typeof ings)[number]; ii: number }) =>
        (stepText.includes(' ' + phrases[ii] + ' ') ? 10 : 0) +
        keys[ii].filter((k) => stepWords.some((w) => sameWord(k, w))).length +
        groupScore[x.group] * 2
      cands.sort((a, b) => score(b) - score(a) || a.ii - b.ii)
      const { x, ii } = cands[0]
      seenHere.add(ii)
      if (!hasQty(x.ing)) return // "sal q.b.": consome a palavra, sem quantidade

      // "os dois açúcares": várias variantes do mesmo ingrediente numa só palavra no plural
      const siblings = cands.filter(
        (c) => c.ii !== ii && hasQty(c.x.ing) && !used.has(c.ii) && keys[c.ii][0] === keys[ii][0] && tok.w !== keys[ii][0],
      )
      if (siblings.length && !used.has(ii)) {
        const all = [{ x, ii }, ...siblings].sort((a, b) => a.ii - b.ii)
        all.forEach((c) => {
          seenHere.add(c.ii)
          used.set(c.ii, 'full')
        })
        inserts.push({
          at: tok.end,
          amount: all.map((c) => `${qtyOf(c.x.ing, factor)} ${scaleIngredient(c.x.ing, factor).item.split('(')[0].trim()}`).join(' + '),
        })
        return
      }

      // Quantidade já escrita no texto, na mesma frase ("3 c. sopa de azeite")
      const before = tokens.slice(Math.max(0, ti - 5), ti).map((t) => t.w)
      const near = before.slice(-3)
      const qtyInText = tokens
        .slice(Math.max(0, ti - 4), ti)
        .some((t) => /\d/.test(t.w) && !/[.;:!?]/.test(step.text.slice(t.end, tok.start).replace(/\bc\./g, '')))
      if (qtyInText) {
        used.set(ii, 'full')
        return
      }
      const isHalf = near.some((w) => w === 'metade' || w === 'meia' || w === 'meio')
      const isRest = near.includes('resto')
      const state = used.get(ii)
      let amount: string | undefined
      if (isHalf && !state) {
        amount = 'metade: ' + qtyOf(x.ing, factor * 0.5)
        used.set(ii, 'half')
      } else if (isRest && state === 'half') {
        amount = 'resto: ' + qtyOf(x.ing, factor * 0.5)
        used.set(ii, 'full')
      } else if (!state) {
        amount = qtyOf(x.ing, factor)
        used.set(ii, 'full')
      }
      if (amount) inserts.push({ at: tok.end, amount })
    })

    // Passos "junta tudo" / "ingredientes da cobertura": lista explícita
    let list: string[] | undefined
    if (ov?.all || ov?.group) {
      list = []
      ings.forEach((x, ii) => {
        if (!hasQty(x.ing) || used.get(ii) === 'full') return
        if (ov.group && groups[x.group].group !== ov.group) return
        if (ov.all && keys[ii].some((k) => skip.has(k))) return
        list!.push(`${qtyOf(x.ing, factor)} ${scaleIngredient(x.ing, factor).item}`)
        used.set(ii, 'full')
      })
    }

    inserts.sort((a, b) => a.at - b.at)
    const segments: Segment[] = []
    let last = 0
    for (const ins of inserts) {
      segments.push({ text: step.text.slice(last, ins.at), amount: ins.amount })
      last = ins.at
    }
    segments.push({ text: step.text.slice(last) })
    return { segments, list }
  })
}

const SAY: [RegExp, string][] = [
  [/(^|[^\d])([1½¼¾⅓]) c\. sopa/g, '$1$2 colher de sopa'],
  [/(^|[^\d])([1½¼¾⅓]) c\. chá/g, '$1$2 colher de chá'],
  [/c\. sopa/g, 'colheres de sopa'],
  [/c\. chá/g, 'colheres de chá'],
  [/ \+ /g, ' e '],
  [/(\d+) ½/g, '$1 e meia'],
  [/(\d+) ¼/g, '$1 e um quarto'],
  [/½/g, 'meia'],
  [/¼/g, 'um quarto de'],
  [/¾/g, 'três quartos de'],
  [/⅓/g, 'um terço de'],
  [/~/g, 'cerca de '],
  [/(\d+) g\b/g, '$1 gramas'],
  [/(\d+) ml\b/g, '$1 mililitros'],
  [/°C/g, ' graus'],
]

/** Texto do passo com as quantidades, pronto para ser lido em voz alta. */
export function stepToSpeech(a: AnnotatedStep) {
  let t = ''
  if (a.list?.length) {
    const items = a.list.map((x) => x.replace(/^([^a-zà-ú]*[a-zà-ú.]+(?: (?:sopa|chá))?) (?!de )/i, (m, q: string) => (/^[~\d¼½¾⅓ -]+$/.test(q) ? m : q + ' de ')))
    t += 'Vais precisar de: ' + items.join(', ') + '. '
  }
  t += a.segments.map((s) => s.text + (s.amount ? `, ${s.amount.replace(':', '')},` : '')).join('')
  for (const [re, rep] of SAY) t = t.replace(re, rep)
  return t
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.;:!?])/g, '$1')
    .replace(/ {2,}/g, ' ')
}
