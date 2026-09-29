import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { categories, formatTime, imageUrl, normalize, recipes } from '../data'

interface Props {
  title: string
  onClose: () => void
  onPick: (slug: string) => void
}

export function RecipePicker({ title, onClose, onPick }: Props) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const list = useMemo(() => {
    const nq = normalize(q.trim())
    return recipes.filter((r) => (!cat || r.category === cat) && (!nq || normalize(r.title + ' ' + r.tags.join(' ')).includes(nq)))
  }, [q, cat])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center" onClick={onClose}>
      <div
        className="animate-fade-up flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-[28px] bg-paper sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-herb-50" aria-label="Fechar">
            <X size={19} />
          </button>
        </div>
        <div className="px-5">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar receita"
              className="h-11 w-full rounded-full border border-line bg-cream pl-10 pr-4 text-sm outline-none focus:border-herb-500"
            />
          </div>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-3">
            {[{ id: '', label: 'Todas' }, ...categories].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  cat === c.id ? 'bg-herb-700 text-white' : 'bg-cream text-ink ring-1 ring-line'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto px-3 pb-5">
          {list.map((r) => (
            <li key={r.slug}>
              <button
                onClick={() => onPick(r.slug)}
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-herb-50"
              >
                <img src={imageUrl(r.image, 120, 120)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{r.title}</span>
                  <span className="block text-xs text-muted">
                    {categories.find((c) => c.id === r.category)?.label} · {formatTime(r.totalMin)}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="p-6 text-center text-sm text-muted">Nada encontrado.</li>}
        </ul>
      </div>
    </div>
  )
}
