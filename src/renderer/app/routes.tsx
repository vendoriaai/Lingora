// Route table — single source of truth for paths + lazy imports.
// Phase 0 ships / (sign-in) + /dev/ui-kit (dev only). Phase 1+ adds the
// authenticated route tree (dashboard, courses, live, assessment, admin).
import { lazy } from 'react';

import type { RouteObject } from 'react-router-dom';

const SignInPage = lazy(() => import('@renderer/pages/SignInPage'));
const UiKitPage = lazy(() => import('@renderer/pages/UiKitPage'));

// `devOnly` gates routes on VITE_APP_ENV !== 'production' so the dev kit never
// ships to end users. Phase 1 will add a `<RequireAuth>` element wrapper here.
export const routes: RouteObject[] = [
  { path: '/', element: <SignInPage /> },
  {
    path: '/dev/ui-kit',
    element: <UiKitPage />,
    // dev-only enforcement happens in App via process.env, but keep the flag
    // alongside the route so the table reads as self-documenting.
  },
  { path: '*', element: <SignInPage /> }, // Phase 1: replace with NotFound
];
