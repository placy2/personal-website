// This module is a build-time SSR entry (see scripts/prerender.mjs), never
// loaded by the dev server, so it's exempt from the components-only-export
// convention react-refresh/only-export-components otherwise enforces.
/* eslint-disable react-refresh/only-export-components */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Re-exported so prerender.mjs can drive route enumeration and per-route
// <title>/description/canonical from this same data.
export { ROUTE_META } from './data/routeMeta';

// Mirrors App.tsx's ErrorBoundary(Router(AppRoutes)) shape, with StaticRouter
// standing in for BrowserRouter.
export function render(url: string): string {
  return renderToString(
    <ErrorBoundary>
      <StaticRouter location={url}>
        <AppRoutes />
      </StaticRouter>
    </ErrorBoundary>
  );
}
