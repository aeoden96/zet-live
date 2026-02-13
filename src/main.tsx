import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DebugProvider } from './contexts/DebugContext.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA functionality
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebugProvider>
      <App />
    </DebugProvider>
  </StrictMode>,
)
