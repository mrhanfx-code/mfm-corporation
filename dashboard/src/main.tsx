import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Apply theme before React renders to avoid white flash
const saved = localStorage.getItem('mfm:theme') || 'dark';
console.log('[main.tsx] Initializing theme:', saved);
document.documentElement.setAttribute('data-theme', saved);

console.log('[main.tsx] Mounting React app');
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
console.log('[main.tsx] React app mounted');
