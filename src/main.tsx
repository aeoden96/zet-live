import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AppModeSwitch } from './components/AppModeSwitch'
import { DebugProvider } from './contexts/DebugContext.tsx'
import { SettingsPage } from './components/Settings/SettingsPage.tsx'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA functionality
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebugProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<AppModeSwitch />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </DebugProvider>
  </StrictMode>,
)
