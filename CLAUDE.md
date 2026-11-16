# CLAUDE.md

## Overview

Personal portfolio for parkerlacy.com. React 19 + TypeScript + Vite SPA in `frontend/`, prerendered to static HTML, deployed to AWS (private S3 + CloudFront, plus Route 53 + ACM in prod) via Terraform in `terraform/`. No backend. Commands: see `README.md`, `frontend/README.md`, `scripts/README.md`.

## Architecture

- Routes live in `frontend/src/App.tsx`. Every new route also needs an entry in `src/data/routeMeta.ts`, which drives prerendering, head tags and the sitemap. `/work/:slug` pages come from `src/data/caseStudies.ts`.
- Path aliases (`@`, `@components`, `@pages`, `@assets`, `@styles`) are defined in **both** `vite.config.ts` and `vitest.config.ts`. Keep them in sync.
- Tests: Vitest + RTL colocated as `*.test.tsx`. Playwright smoke tests in `e2e/` run against `vite preview` (needs a prior build). Vitest excludes `e2e/**`.
- Terraform: one config, parameterized by `env/<env>.tfvars` and `env/<env>.s3.tfbackend`. Both envs serve a private bucket through CloudFront with Origin Access Control. Dev uses the `*.cloudfront.net` name and is torn down regularly. Prod adds Route 53 + ACM for the custom domain. Terraform manages infra only, never site objects. A deploy is `terraform apply`, then `scripts/upload-site.sh` (uploads `frontend/dist/**` with explicit Content-Type/Cache-Control, then invalidates CloudFront), so build the frontend first.
- `terraform/functions/rewrite-index.js` (viewer-request) maps `/path` to `/path/index.html`. The REST origin has no index document, so every page depends on it. Retired routes 301 from its `REDIRECTS` map. Test with `node --test terraform/functions/*.test.mjs`.
- State locking is S3-native (`use_lockfile = true`). Pass `-lock-timeout=5m`. After pulling, re-run `terraform init -reconfigure -backend-config=env/<env>.s3.tfbackend` once.
- The GitHub OIDC provider and deploy role live in the private `aws-infra` repo (`github-oidc/`). Trust or permission changes go there.

## CI/CD

- `pr-validate.yml` and `lighthouse.yml` use plain `pull_request` (no secrets) so Dependabot PRs run pre-merge. Never switch them to `pull_request_target`.
- `deploy.yml`: push to `main` deploys dev. Prod needs environment approval or `workflow_dispatch`.
- Pre-commit hook (husky + lint-staged) runs eslint --fix and prettier on staged files.
