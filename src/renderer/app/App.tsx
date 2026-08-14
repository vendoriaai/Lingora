// App — router + ThemeProvider + route bootstrap (docs/13 §2.4).
// Phase 0: ThemeProvider + Router; dev route gated on VITE_APP_ENV.
// Phase 1+ adds AuthProvider/ProtectedRoute and the full shell via layout routes.
import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import { ThemeProvider } from './providers/ThemeProvider';
import { routes } from './routes';

const isProd = import.meta.env.VITE_APP_ENV === 'production';

// Gate the dev kit out of production builds at the router level.
const safeRoutes = isProd
  ? routes.map((r) => (r.path === '/dev/ui-kit' ? { ...r, element: <Navigate to="/" replace /> } : r))
  : routes;

const router = createBrowserRouter(safeRoutes);

function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-text-muted">Loading…</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
