import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FavoritesProvider } from './lib/favorites'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { RecipePage } from './pages/RecipePage'
import { CookMode } from './pages/CookMode'
import { Favorites } from './pages/Favorites'
import { NotFound } from './pages/NotFound'
import { Splash } from './components/Splash'

export default function App() {
  return (
    <FavoritesProvider>
      <Splash />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="receitas" element={<Explore />} />
            <Route path="receita/:slug" element={<RecipePage />} />
            <Route path="favoritos" element={<Favorites />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="receita/:slug/cozinhar" element={<CookMode />} />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  )
}
