import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production build prerenders the page into #root (scripts/prerender.mjs); dev starts empty.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
