# Personal Website

[![Deploy](https://github.com/placy2/personal-website/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/placy2/personal-website/actions/workflows/deploy.yml)
[![PR Validation](https://github.com/placy2/personal-website/actions/workflows/pr-validate.yml/badge.svg)](https://github.com/placy2/personal-website/actions/workflows/pr-validate.yml)
[![Lighthouse CI](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml)
[![Lighthouse Performance](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fplacy2%2Fpersonal-website%2Flighthouse-reports%2Fbadges%2Fperformance.json)](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml)
[![Lighthouse Accessibility](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fplacy2%2Fpersonal-website%2Flighthouse-reports%2Fbadges%2Faccessibility.json)](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml)
[![Lighthouse Best Practices](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fplacy2%2Fpersonal-website%2Flighthouse-reports%2Fbadges%2Fbest-practices.json)](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml)
[![Lighthouse SEO](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fplacy2%2Fpersonal-website%2Flighthouse-reports%2Fbadges%2Fseo.json)](https://github.com/placy2/personal-website/actions/workflows/lighthouse.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?logo=dependabot&logoColor=white)](https://github.com/placy2/personal-website/blob/main/.github/dependabot.yml)

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Terraform ≥1.17](https://img.shields.io/badge/Terraform-%E2%89%A51.13-844FBA?logo=terraform&logoColor=white)
![AWS S3 + CloudFront](https://img.shields.io/badge/AWS-S3%20%2B%20CloudFront-232F3E?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOS4zNSAxMC4wNEE3LjQ5IDcuNDkgMCAwIDAgMTIgNEM5LjExIDQgNi42IDUuNjQgNS4zNSA4LjA0QTUuOTk0IDUuOTk0IDAgMCAwIDAgMTRjMCAzLjMxIDIuNjkgNiA2IDZoMTNjMi43NiAwIDUtMi4yNCA1LTUgMC0yLjY0LTIuMDUtNC43OC00LjY1LTQuOTZ6Ii8+PC9zdmc+)

Personal portfolio site for [parkerlacy.com](https://parkerlacy.com): a statically prerendered React app on AWS (S3 + CloudFront + Route 53), managed with Terraform and deployed through GitHub Actions. There is no backend.

## Quick Start

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Optional: `cp .env.example .env.local` to override `VITE_APP_VERSION`.

## Architecture

- **Frontend**: React 19 + TypeScript + Vite, prerendered to static HTML per route (`frontend/scripts/prerender.mjs`)
- **Styling**: Plain CSS with custom properties
- **Infrastructure**: AWS S3 + CloudFront + Route 53 + ACM (prod); S3 only (dev)
- **IaC**: Terraform, one config parameterized per environment (`terraform/env/`)
- **CI/CD**: GitHub Actions: PR validation, Lighthouse CI, Terraform plan, deploy
- **Testing**: Vitest + React Testing Library (unit and a11y), Playwright (e2e against the production build), Lighthouse CI (perf/a11y/best-practices/SEO)

## Project Structure

```
personal-website/
├── frontend/
│   ├── src/
│   │   ├── components/   # Shared components
│   │   ├── pages/        # One component per route
│   │   ├── data/         # Case studies, projects, route metadata
│   │   ├── constants/    # Shared constants
│   │   ├── seo/          # Head tag generation
│   │   └── stylesheets/  # CSS, one file per component
│   ├── e2e/              # Playwright smoke tests
│   ├── scripts/          # Prerender + Lighthouse badge scripts
│   └── public/           # Static assets (robots.txt, security.txt, ...)
├── terraform/
│   ├── *.tf              # Infrastructure
│   ├── env/              # Per-environment tfvars + backend config
│   └── functions/        # CloudFront Function (route rewriting)
├── scripts/              # Deploy / teardown / smoke-test helpers
├── docs/                 # Runbooks
└── .github/              # Workflows + Dependabot config
```

## Development

Frontend commands (run from `frontend/`):

```bash
npm run dev           # dev server
npm run build         # typecheck + production build
npm run preview       # preview the production build
npm run test:run      # unit tests, single pass (test for watch mode)
npm run test:coverage # unit tests with coverage
npm run test:e2e      # Playwright smoke tests (needs a prior build)
npm run lint          # eslint (lint:fix to autofix)
npm run format:check  # prettier (format to write)
npm run lhci          # Lighthouse CI against dist/ (needs a prior build + Chrome)
```

A husky pre-commit hook (installed by `npm install` in `frontend/`) runs ESLint and Prettier on staged files.

See [`frontend/README.md`](frontend/README.md) for structure and styling conventions.

## Environments

| | Dev | Prod |
|---|---|---|
| Stack | S3 website only | S3 + CloudFront + Route 53 |
| Bucket | `parkerlacy-dev-hosting` | `parkerlacy-website-hosting` |
| Domain | S3 website endpoint | `parkerlacy.com` |

Dev is torn down regularly to save cost, so it is often absent.

## Infrastructure and Deployment

Deploys run through GitHub Actions (`deploy.yml`): a push to `main` deploys dev automatically, and prod requires manual approval via a GitHub environment. PRs touching `terraform/**` get a plan comment; PRs touching `frontend/**` run lint, tests, build, Playwright and Lighthouse. Workflows authenticate to AWS with GitHub OIDC (no static keys).

Terraform state lives in S3 with S3-native locking (`use_lockfile = true`). To run Terraform locally (e.g. `plan`):

```bash
cd terraform
terraform init -reconfigure -backend-config=env/<dev|prod>.s3.tfbackend
terraform plan -lock-timeout=5m -var-file="env/<dev|prod>.tfvars"
```

Helper scripts (`scripts/deploy.sh`, `teardown.sh`, `smoke-test.sh`) wrap these commands; see [`scripts/README.md`](scripts/README.md) for usage and troubleshooting. The site is deployed by Terraform uploading `frontend/dist/**`, so the frontend must be built first.

After each deploy, `scripts/smoke-test.sh <url>` checks the live site (HTTP 200, expected content, valid HTML, React root).

## License

- Code: MIT, see [LICENSE.md](LICENSE.md).
- Personal content (résumé text, biography, original images, etc.): All Rights Reserved, see [CONTENT_LICENSE.md](CONTENT_LICENSE.md).
