import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Share2, ShoppingBasket, Trash2, X } from 'lucide-react'
import { SECTIONS, useShopping } from '../lib/shopping'
import { toast } from '../lib/toast'

export function ShoppingList() {
  const shop = useShopping()
  const [text, setText] = useState('')
  const recipesInList = [...new Map(shop.items.filter((i) => i.slug).map((i) => [i.slug, i.recipe])).entries()]

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    shop.addText(text.trim())
    setText('')
  }

  const share = async () => {
    const lines: string[] = ['Lista de compras (Tempero)', '']
    for (const s of SECTIONS) {
      const items = shop.items.filter((i) => i.section === s.id && !i.done)
      if (!items.length) continue
      lines.push(s.label.toUpperCase())
      for (const i of items) lines.push(`- ${i.qty ? i.qty + ' ' : ''}${i.text}`)
      lines.push('')
    }
    const body = lines.join('\n')
    try {
      if (navigator.share) await navigator.share({ title: 'Lista de compras', text: body })
      else {
        await navigator.clipboard.writeText(body)
        toast('Lista copiada')
      }
    } catch {
      /* cancelado */
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-herb-900 sm:text-4xl">Lista de compras</h1>
          <p className="mt-1 text-muted">
            {shop.pending ? `${shop.pending} por comprar` : 'Organizada por secção do supermercado.'}
          </p>
        </div>
        {shop.items.length > 0 && (
          <button
            onClick={share}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-herb-700 px-4 text-sm font-bold text-white transition hover:bg-herb-600"
          >
            <Share2 size={16} /> Partilhar
          </button>
        )}
      </div>

      <form onSubmit={add} className="mt-6 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar artigo (ex.: 1 pacote de leite)"
          aria-label="Adicionar artigo"
          className="h-12 flex-1 rounded-2xl border border-line bg-paper px-4 text-[15px] shadow-soft outline-none focus:border-herb-500 focus:ring-4 focus:ring-herb-100"
        />
        <button className="grid h-12 w-12 place-items-center rounded-2xl bg-herb-700 text-white transition hover:bg-herb-600" aria-label="Adicionar">
          <Plus size={20} />
        </button>
      </form>

      {recipesInList.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {recipesInList.map(([slug, title]) => (
            <Link key={slug} to={`/receita/${slug}`} className="rounded-full bg-herb-50 px-3 py-1 text-xs font-semibold text-herb-700 hover:bg-herb-100">
              {title}
            </Link>
          ))}
        </div>
      )}

      {shop.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-card bg-paper px-6 py-14 text-center ring-1 ring-line">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-herb-50 text-herb-700">
            <ShoppingBasket size={24} />
          </div>
          <p className="mt-4 font-bold">A lista está vazia</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Numa receita, toca em "Lista de compras", ou gera a lista a partir do plano da semana.
          </p>
          <div className="mt-5 flex gap-2">
            <Link to="/receitas" className="rounded-full bg-herb-700 px-5 py-2.5 text-sm font-bold text-white">
              Ver receitas
            </Link>
            <Link to="/plano" className="rounded-full px-5 py-2.5 text-sm font-bold text-herb-700 ring-1 ring-line">
              Plano da semana
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {SECTIONS.map((s) => {
            const items = shop.items.filter((i) => i.section === s.id)
            if (!items.length) return null
            return (
              <section key={s.id} className="reveal rounded-card bg-paper p-4 ring-1 ring-line/60 sm:p-5">
                <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-herb-600">{s.label}</h2>
                <ul className="divide-y divide-line/70">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2.5">
                      <button
                        onClick={() => shop.toggle(i.id)}
                        aria-pressed={i.done}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span
                          className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 transition ${
                            i.done ? 'border-herb-600 bg-herb-600 text-white' : 'border-line'
                          }`}
                        >
                          {i.done && <Check size={14} strokeWidth={3} />}
                        </span>
                        <span className={`min-w-0 text-[15px] leading-snug transition ${i.done ? 'text-muted line-through' : ''}`}>
                          {i.qty && <strong className="font-bold">{i.qty} </strong>}
                          {i.text}
                          {i.recipe && <span className="block truncate text-xs text-muted">{i.recipe}</span>}
                        </span>
                      </button>
                      <button
                        onClick={() => shop.remove(i.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-herb-50 hover:text-ink"
                        aria-label="Remover"
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button onClick={shop.clearDone} className="rounded-full px-4 py-2 text-sm font-semibold text-muted ring-1 ring-line hover:text-ink">
              Limpar comprados
            </button>
            <button
              onClick={() => {
                if (window.confirm('Apagar a lista toda?')) shop.clearAll()
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-tomato ring-1 ring-line hover:bg-tomato/10"
            >
              <Trash2 size={15} /> Limpar tudo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
