import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// If a previous PWA/service worker was registered on this origin, Workbox can warn and cache stale assets/routes.
// This app doesn't rely on a service worker, so we unregister by default in dev (and when explicitly disabled).
const disableServiceWorker =
  (import.meta as any).env?.DEV ||
  (import.meta as any).env?.VITE_DISABLE_SW === 'true' ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

if (disableServiceWorker && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
