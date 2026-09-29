import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Logo'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <LogoMark className="h-16 w-16" />
      <h1 className="mt-6 font-display text-3xl font-semibold text-herb-900">Esta receita queimou-se.</h1>
      <p className="mt-2 text-muted">A página que procuras não existe ou mudou de sítio.</p>
      <Link to="/" className="mt-6 rounded-full bg-herb-700 px-6 py-3 font-bold text-white hover:bg-herb-600">
        Voltar ao início
      </Link>
    </div>
  )
}
