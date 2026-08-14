// React root — mount <App/>. Providers live in App itself (per docs/13 §2.4).
// Keep this file free of business logic so it stays cheap to hot-replace.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './shared/styles/tokens.css';
import './shared/styles/tailwind.css';
import './shared/styles/motion.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Lingora: #root not found in index.html');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
