import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FavoritesProvider } from './lib/favorites'
import { Layout } from './components/Layout'
import { Splash } from './components/Splash'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { RecipePage } from './pages/RecipePage'
import { CookMode } from './pages/CookMode'
import { Favorites } from './pages/Favorites'
import { ShoppingList } from './pages/ShoppingList'
import { Planner } from './pages/Planner'
import { Fridge } from './pages/Fridge'
import { NotFound } from './pages/NotFound'

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
            <Route path="lista" element={<ShoppingList />} />
            <Route path="plano" element={<Planner />} />
            <Route path="frigorifico" element={<Fridge />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="receita/:slug/cozinhar" element={<CookMode />} />
        </Routes>
      </BrowserRouter>
    </FavoritesProvider>
  )
}
