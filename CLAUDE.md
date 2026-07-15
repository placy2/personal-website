# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal portfolio site for parkerlacy.com. React 19 + TypeScript + Vite SPA in `frontend/`, deployed as a static site to AWS (S3, plus CloudFront + Route 53 in prod) via Terraform in `terraform/`. There is no backend server.

## Commands

All frontend commands run from `frontend/`:

```bash
npm run dev            # Dev server at http://localhost:5173 (or ./scripts/dev-setup.sh / docker-compose up for Docker)
npm run build          # tsc -b && vite build → dist/
npm run lint           # eslint .   (lint:fix to auto-fix)
npm run format:check   # prettier   (format to write)
npm run test           # vitest watch mode
npm run test:run       # vitest, single pass (what CI runs)
npx vitest run src/pages/Home.test.tsx        # single test file
npx vitest run -t "renders heading"           # single test by name
npm run test:e2e       # Playwright smoke tests (e2e/); auto-starts `vite preview` on :4173, requires a prior build
```

Infrastructure (from repo root; see `scripts/README.md` for AWS setup details):

```bash
./scripts/deploy.sh <dev|prod> <plan|apply>   # runs terraform init -reconfigure with env/<env>.s3.tfbackend first
./scripts/teardown.sh dev                     # destroy dev infra (dev is torn down regularly to save cost)
./scripts/smoke-test.sh <url>                 # curl-based checks against a deployed site
```

## Architecture

- `frontend/src/App.tsx` — react-router-dom `BrowserRouter` with four routes: `/` (Home), `/about`, `/projects`, `/resume`. Pages live in `src/pages/`, shared components in `src/components/`, page content/data in `src/data/` and `src/constants/`, CSS (custom properties, one file per component) in `src/stylesheets/`.
- Path aliases `@`, `@components`, `@pages`, `@assets`, `@styles` are defined in **both** `vite.config.ts` and `vitest.config.ts` — keep them in sync if changed.
- Two test layers: Vitest + React Testing Library unit tests colocated with source (`*.test.tsx`, jsdom, setup in `src/test/setup.ts`), and Playwright smoke tests in `e2e/` that run against the real production build (`vite preview`) to catch bundle-level regressions unit tests can't see. Vitest excludes `e2e/**`; don't put Playwright specs elsewhere.
- Terraform: single config in `terraform/`, parameterized per environment via `env/dev.tfvars` / `env/prod.tfvars` with separate backend state files (`env/*.s3.tfbackend`). Dev is S3-only (cost saving); prod adds CloudFront + Route 53 + ACM for parkerlacy.com. Terraform itself uploads `frontend/dist/**` as `aws_s3_object` resources — deploying the site is a `terraform apply`, so the frontend must be built first (deploy.sh handles this).

## CI/CD (GitHub Actions)

- `pr-validate.yml`: on PRs touching `frontend/**` — lint, unit tests, format check, build, Playwright e2e. Deliberately uses plain `pull_request` (no secrets) so Dependabot/Actions-bump PRs exercise the workflow pre-merge; don't switch it to `pull_request_target`.
- `terraform-plan.yml`: terraform plan on PRs touching `terraform/**`.
- `deploy.yml`: on push to main — detects meaningful changes (frontend/terraform/workflows), deploys to dev automatically; prod requires manual approval via GitHub environments or `workflow_dispatch`.
- Pre-commit hook (husky, config lives in `frontend/.husky/` and `lint-staged` in `frontend/package.json`) runs eslint --fix + prettier on staged files.
