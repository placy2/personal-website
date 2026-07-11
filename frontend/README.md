# Frontend

React 19 + TypeScript + Vite app for [parkerlacy.com](https://parkerlacy.com).

## Commands

```bash
npm run dev        # start dev server (http://localhost:5173)
npm run build      # typecheck + production build
npm run test       # vitest watch mode (test:run for CI mode)
npm run lint       # eslint (lint:fix to autofix)
npm run format     # prettier
```

## Structure

```
src/
├── components/     # Shared components (MenuBar, Footer, ...)
├── pages/          # One component per route
├── data/           # Content as typed data (e.g. projects.ts — add a project here)
├── constants/      # App config, routes, external links, tech list
├── stylesheets/    # Plain CSS, one file per component/page
└── assets/         # Images bundled by Vite
```

Routes are declared in `App.tsx`. To add a page: create it in `pages/`, add a `<Route>` in `App.tsx`, and a `MenuItem` in `components/MenuBar.tsx`.

## Styling conventions

Plain CSS with custom properties — no framework, keep it that way unless there's a strong reason.

- **Design tokens live in `stylesheets/index.css`** (`:root`): colors, spacing scale (`--space-*`), type scale (`--text-*`), radius, content width. Global element defaults (`body`, headings, links) also live there.
- **Never hardcode colors** in component stylesheets — always reference `--theme-*` variables. New colors get added as tokens first.
- **One stylesheet per component/page**, imported by its owner (`MenuBar.tsx` imports `MenuBar.css`). Layout shell + shared utilities (`.button`, footer) live in `App.css`, imported by `App.tsx`.
- Use the spacing/type variables instead of magic numbers so pages stay consistent.
- Pages are left-aligned inside the centered `.main-content` column; the Home hero is the one intentionally centered exception.
