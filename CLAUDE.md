# CLAUDE.md

## Overview

Personal portfolio for parkerlacy.com. React 19 + TypeScript + Vite SPA in `frontend/`, prerendered to static HTML, deployed to AWS (S3, plus CloudFront + Route 53 in prod) via Terraform in `terraform/`. No backend. Commands: see `README.md`, `frontend/README.md`, `scripts/README.md`.

## Architecture

- Routes live in `frontend/src/App.tsx`. Every new route also needs an entry in `src/data/routeMeta.ts`, which drives prerendering, head tags and the sitemap. `/work/:slug` pages come from `src/data/caseStudies.ts`.
- Path aliases (`@`, `@components`, `@pages`, `@assets`, `@styles`) are defined in **both** `vite.config.ts` and `vitest.config.ts`. Keep them in sync.
- Tests: Vitest + RTL colocated as `*.test.tsx`. Playwright smoke tests in `e2e/` run against `vite preview` (needs a prior build). Vitest excludes `e2e/**`.
- Terraform: one config, parameterized by `env/<env>.tfvars` and `env/<env>.s3.tfbackend`. Dev is S3-only and torn down regularly. Prod adds CloudFront + Route 53 + ACM. Deploying is a `terraform apply` that uploads `frontend/dist/**`, so build the frontend first.
- State locking is S3-native (`use_lockfile = true`). Pass `-lock-timeout=5m`. After pulling, re-run `terraform init -reconfigure -backend-config=env/<env>.s3.tfbackend` once.
- The GitHub OIDC provider and deploy role live in the private `aws-infra` repo (`github-oidc/`). Trust or permission changes go there.

## CI/CD

- `pr-validate.yml` and `lighthouse.yml` use plain `pull_request` (no secrets) so Dependabot PRs run pre-merge. Never switch them to `pull_request_target`.
- `deploy.yml`: push to `main` deploys dev. Prod needs environment approval or `workflow_dispatch`.
- Pre-commit hook (husky + lint-staged) runs eslint --fix and prettier on staged files.
