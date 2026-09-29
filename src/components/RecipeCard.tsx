import { Link } from 'react-router-dom'
import { Clock, ChefHat } from 'lucide-react'
import { type Recipe, getCategory, imageUrl, formatTime } from '../data'
import { FavoriteButton } from './FavoriteButton'

export function RecipeCard({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  const cat = getCategory(recipe.category)
  return (
    <Link
      to={`/receita/${recipe.slug}`}
      className="reveal group block overflow-hidden rounded-card bg-paper shadow-soft ring-1 ring-line/60 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-herb-500"
    >
      <div className={`relative overflow-hidden bg-herb-50 ${compact ? 'aspect-[4/3]' : 'aspect-[5/4]'}`}>
        <img
          src={imageUrl(recipe.image, 640, compact ? 480 : 512)}
          alt={recipe.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <FavoriteButton slug={recipe.slug} className="absolute right-3 top-3 h-9 w-9" size={17} />
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-herb-600">{cat?.label}</p>
        <h3 className="mt-1 line-clamp-2 text-[15.5px] font-bold leading-snug text-ink">{recipe.title}</h3>
        <div className="mt-3 flex items-center gap-4 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {formatTime(recipe.totalMin)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChefHat size={14} /> {recipe.difficulty}
          </span>
        </div>
      </div>
    </Link>
  )
}
