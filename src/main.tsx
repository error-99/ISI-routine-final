import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge obsolete service worker caches on startup when online to guarantee live database data
if (typeof window !== 'undefined' && 'caches' in window && navigator.onLine) {
  window.caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key !== 'isu-routine-cache-v4') {
        window.caches.delete(key);
      }
    });
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
