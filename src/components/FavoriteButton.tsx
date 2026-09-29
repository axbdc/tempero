import { Heart } from 'lucide-react'
import { useFavorites } from '../lib/favorites'

export function FavoriteButton({ slug, className = '', size = 18 }: { slug: string; className?: string; size?: number }) {
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(slug)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(slug)
      }}
      aria-pressed={active}
      aria-label={active ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
      className={`grid place-items-center rounded-full bg-paper/95 text-ink shadow-soft backdrop-blur transition hover:scale-105 active:scale-95 ${className}`}
    >
      <Heart size={size} className={active ? 'heart-pop fill-tomato text-tomato' : ''} strokeWidth={2} />
    </button>
  )
}
