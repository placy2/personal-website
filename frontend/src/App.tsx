import './stylesheets/App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import MenuBar from './components/MenuBar';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Resume from './pages/Resume';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  return (
    // Top-level boundary is the last line of defense (e.g. router/nav failures).
    <ErrorBoundary>
      <Router>
        <MenuBar />
        <main className="main-content">
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
      </Router>
    </ErrorBoundary>
  );
};

// Remounts the boundary on each route change so navigating away clears an error.
const RouteBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
};

export default App;
