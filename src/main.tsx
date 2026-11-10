import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Rutas con # (…/#/diario): funcionan en cualquier hosting estático y sin conexión
import { HashRouter } from 'react-router-dom';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-sans/latin-700.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-600.css';
import './styles.css';
import './state/install';
import App from './App';
import { ToastProvider } from './components/Toast';
import { AppStateProvider } from './state/AppState';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppStateProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppStateProvider>
    </HashRouter>
  </StrictMode>
);
