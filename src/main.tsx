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

// Set CSS variable --svh = 1% of the small viewport height (in px)
// to avoid mobile browser address-bar resizing issues when using vh.
function setSVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--svh', `${vh}px`);
}

setSVH();
window.addEventListener('resize', setSVH, { passive: true });
window.addEventListener('orientationchange', setSVH);
if ((window as any).visualViewport) {
  (window as any).visualViewport.addEventListener('resize', setSVH);
}

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
