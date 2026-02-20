import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ListApp } from './components/ListMode/ListApp.tsx'
import { DebugProvider } from './contexts/DebugContext.tsx'
import { SettingsPage } from './components/Settings/SettingsPage.tsx'
import { useSettingsStore } from './stores/settingsStore.ts'
import { registerSW } from 'virtual:pwa-register'

// Register service worker for PWA functionality
registerSW({ immediate: true })

/** Renders map or list mode based on user preference */
function AppModeSwitch() {
  const appMode = useSettingsStore((s) => s.appMode);
  return appMode === 'list' ? <ListApp /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DebugProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppModeSwitch />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
    </DebugProvider>
  </StrictMode>,
)
