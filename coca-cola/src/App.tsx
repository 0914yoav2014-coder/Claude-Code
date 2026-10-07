import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Flavor from './pages/Flavor'
import Brands from './pages/Brands'
import About from './pages/About'
import HowItsMade from './pages/HowItsMade'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="flavors/:slug" element={<Flavor />} />
          <Route path="brands" element={<Brands />} />
          <Route path="about" element={<About />} />
          <Route path="how-its-made" element={<HowItsMade />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
