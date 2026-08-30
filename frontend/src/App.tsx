import './stylesheets/App.css';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import MenuBar from './components/MenuBar';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Resume from './pages/Resume';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTE_META } from './data/routeMeta';

// Router-agnostic route tree, shared by the client (wrapped in BrowserRouter
// below) and the SSR prerender entry (src/entry-server.tsx, wrapped in
// StaticRouter instead).
export const AppRoutes: React.FC = () => {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <MenuBar />
      <main id="main-content" className="main-content" tabIndex={-1}>
        {/* Per-route boundary keyed on pathname: a crash on one page shows a
            fallback but keeps the nav and footer intact, and resets on
            navigation. */}
        <RouteBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/resume" element={<Resume />} />
          </Routes>
        </RouteBoundary>
      </main>
      <Footer />
      <TitleSync />
    </>
  );
};

const App: React.FC = () => {
  return (
    // Top-level boundary is the last line of defense (e.g. router/nav failures).
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
};

// Remounts the boundary on each route change so navigating away clears an error.
const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
};

// Keeps <title> and the meta description in sync with the prerendered HTML for
// this route on client-side navigation (see src/data/routeMeta.ts). Only runs
// client-side (useEffect never fires during renderToString), so the initial
// prerendered markup is the source of truth for crawlers.
const TitleSync: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = ROUTE_META.find(route => route.path === pathname);
    if (!meta) return;

    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [pathname]);

  return null;
};

export default App;
