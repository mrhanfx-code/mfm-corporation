import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme before React renders to avoid white flash
const saved = localStorage.getItem('mfm:theme') || 'dark';
document.documentElement.setAttribute('data-theme', saved);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
