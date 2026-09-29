import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { recipes } from '../data'
import { useFavorites } from '../lib/favorites'
import { RecipeCard } from '../components/RecipeCard'

export function Favorites() {
  const { favorites } = useFavorites()
  const list = recipes.filter((r) => favorites.includes(r.slug))

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-herb-900 sm:text-4xl">Favoritos</h1>
      <p className="mt-1 text-muted">As receitas que guardaste, neste dispositivo.</p>

      {list.length ? (
        <div className="mt-6 grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((r) => (
            <RecipeCard key={r.slug} recipe={r} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center rounded-card bg-paper px-6 py-14 text-center ring-1 ring-line">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-herb-50 text-herb-700">
            <Heart size={24} />
          </div>
          <p className="mt-4 font-bold">Ainda não tens favoritos</p>
          <p className="mt-1 max-w-xs text-sm text-muted">Toca no coração de uma receita para a guardares aqui.</p>
          <Link to="/receitas" className="mt-5 rounded-full bg-herb-700 px-5 py-2.5 text-sm font-bold text-white">
            Explorar receitas
          </Link>
        </div>
      )}
    </div>
  )
}
