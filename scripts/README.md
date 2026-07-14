# Scripts

Helper scripts for local development and infrastructure management. All infrastructure scripts
(`deploy.sh`, `teardown.sh`) are thin wrappers around the Terraform configuration in `../terraform`
and assume they are run from anywhere in the repo (they `cd` relative to their own location).

## Prerequisites

### For infrastructure scripts (`deploy.sh`, `teardown.sh`)

- **Terraform** `>= 1.13.5` (matches `terraform/provider.tf`) on your `PATH`.
- **AWS credentials** resolvable via the standard AWS provider chain — one of:
  - `~/.aws/credentials` / `~/.aws/config` (e.g. via `aws configure` or `aws sso login`), or
  - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally
    `AWS_SESSION_TOKEN`, or
  - `AWS_PROFILE` pointing at a named profile.
  - The credentials need permissions on S3 (bucket + object management), CloudFront, and Route 53
    (prod only), plus read/write access to the remote state bucket (see below).
- **Remote state bucket** `parker-terraform-backends` (hardcoded in `terraform/provider.tf`) must
  already exist in `us-east-1` and be accessible to your credentials. These scripts do not create it.
- **Node.js + npm**, only if `frontend/dist` doesn't exist yet — `deploy.sh` will run
  `npm run build` for you in that case.

### For `dev-setup.sh`

- **Docker** and **Docker Compose** (the `docker compose` CLI plugin, not the legacy
  `docker-compose` binary).

### For `smoke-test.sh`

- `curl` (no other dependencies). No AWS credentials required — it just hits the public URL.

## Scripts

### `deploy.sh` — plan/apply/destroy Terraform for an environment

```bash
./scripts/deploy.sh [environment] [action]
```

| Arg           | Default | Values                  |
|---------------|---------|-------------------------|
| `environment` | `dev`   | `dev`, `prod`           |
| `action`      | `plan`  | `plan`, `apply`, `destroy` |

Examples:
```bash
./scripts/deploy.sh              # plan against dev
./scripts/deploy.sh dev apply    # deploy dev
./scripts/deploy.sh prod plan    # plan prod without applying
./scripts/deploy.sh prod apply   # deploy prod (S3 + CloudFront + Route 53)
```

What it does, in order:
1. `cd`s into `../terraform`.
2. Runs `terraform init -reconfigure -backend-config="env/${environment}.s3.tfbackend"`. The
   `-reconfigure` + per-environment backend file combo is intentional: state for `dev` and `prod`
   live under different keys in the same S3 bucket (see `terraform/env/*.s3.tfbackend`), so the
   backend must be re-pointed every time you switch environments in the same working directory.
   Skipping this (or reusing a stale `.terraform/` dir) is the most common cause of "wrong
   environment" mistakes.
3. If `../frontend/dist` doesn't exist, builds the frontend (`npm run build`) first — this matters
   because `terraform/main.tf` uses `fileset()` to enumerate `../frontend/dist/**/*` and upload each
   file as an `aws_s3_object`. An empty or missing `dist/` means Terraform will plan to remove/upload
   nothing meaningful.
4. Runs the requested `terraform` action with `-var-file="env/${environment}.tfvars"`.
   `apply` and `destroy` both pass `-auto-approve` — there is no interactive confirmation, so double
   check `environment`/`action` before running, especially for `prod`.

**Note:** the frontend build check only looks for the directory's existence, not freshness. If you've
already deployed once and then change frontend code, `dist/` still exists from the old build and
`deploy.sh` will silently skip rebuilding. Run `cd frontend && npm run build` yourself first if you
want to be sure you're deploying the latest code.

### `teardown.sh` — destroy an environment's infrastructure

```bash
./scripts/teardown.sh [environment]
```

| Arg           | Default | Values        |
|---------------|---------|---------------|
| `environment` | `dev`   | `dev`, `prod` |

Example:
```bash
./scripts/teardown.sh dev     # tear down dev to stop paying for it
```

Equivalent to `deploy.sh <environment> destroy`, minus the frontend-build step (not needed to
destroy resources). Re-initializes the backend for the target environment first, for the same
reason as `deploy.sh`. Also passes `-auto-approve` — no confirmation prompt.

Intended for cost control on the `dev` environment, which has no CloudFront/Route53 but still
incurs small S3 costs. `prod` teardown works the same way but will take down the live site,
CloudFront distribution, and (since `aws_route53_zone` is only created `count = var.environment ==
"prod" ? 1 : 0`) the Route 53 hosted zone — recreating a hosted zone means new nameservers, which
you'd need to update at your domain registrar. Avoid tearing down prod casually.

### `dev-setup.sh` — one-command local dev environment via Docker

```bash
./scripts/dev-setup.sh
```

Takes no arguments. What it does:
1. Verifies `docker` and `docker compose` are installed (exits with a clear error if not).
2. Copies `.env.example` → `.env.local` if `.env.local` doesn't exist yet (won't overwrite an
   existing one).
3. Runs `docker compose up --build -d` from the repo root (uses whatever `docker-compose.yml` /
   `Dockerfile.dev` is configured there).
4. Prints the local URL (`http://localhost:5173`) and a cheat-sheet of follow-up commands
   (`docker compose logs -f`, `docker compose down`, etc).

No cloud credentials needed — this is purely local.

### `smoke-test.sh` — post-deploy validation against a live URL

```bash
./scripts/smoke-test.sh <url>
```

Example:
```bash
./scripts/smoke-test.sh http://parkerlacy-dev-hosting.s3-website-us-east-1.amazonaws.com
./scripts/smoke-test.sh https://<cloudfront-domain>.cloudfront.net
```

Runs against the URL produced by `terraform output s3_url` (dev) or `terraform output
cloudfront_url` (prod) — see the deploy workflow's "Get \*URL for smoke tests" steps for how CI
wires this together automatically after `terraform apply`.

Checks performed (exit code `0` unless the hard checks below fail):
- **HTTP 200** status (hard failure if not 200, or if `curl` can't connect at all).
- **Response time** (informational only).
- **Expected content markers** present in the HTML (`"Parker Lacy"`, `"DevOps"`, `"Cloud"`) — soft
  failure: logs a warning but does not exit non-zero, since copy changes shouldn't break the build.
- **Valid HTML structure** (`<!doctype html>` + `</html>`) — hard failure.
- **React root container** (`id="root"`) present — soft failure.

A future Playwright-based e2e suite is sketched in comments at the bottom of the script (not yet
implemented); see the "Playwright integration" work already added for the actual test suite under
`frontend/`.

## Troubleshooting

- **`terraform init` fails with a backend/state lock or "Backend configuration changed" error** —
  you likely ran a script for one environment right after another without a clean directory in
  between, or edited `terraform/provider.tf`/backend files by hand. Both `deploy.sh` and
  `teardown.sh` already pass `-reconfigure`; if you're running raw `terraform` commands yourself,
  add `-reconfigure` (or `terraform init -migrate-state` if you intentionally changed the backend).
- **`Error: error configuring S3 Backend: ... NoCredentialProviders` / `403 Forbidden`** — your AWS
  credentials aren't set up or don't have access to the `parker-terraform-backends` state bucket.
  Run `aws sts get-caller-identity` to confirm which identity Terraform will use.
- **Deploy runs but the site doesn't reflect recent frontend changes** — see the note under
  `deploy.sh` above: it only checks whether `frontend/dist` exists, not whether it's stale. Rebuild
  manually (`cd frontend && npm run build`) before deploying.
- **`BucketAlreadyExists` / `BucketAlreadyOwnedByYou` on apply** — S3 bucket names are globally
  unique. If you've renamed `bucket_name` in `terraform/env/*.tfvars` or are standing up a new
  environment, pick a name nobody else on AWS has claimed.
- **State conflicts / "resource already managed"** — there is no DynamoDB table configured for state
  locking (`terraform/provider.tf` only sets `bucket`/`region` on the S3 backend). Avoid running
  `deploy.sh`/`teardown.sh` concurrently against the same environment, including from CI and locally
  at the same time.
- **CloudFront changes in `prod` "apply" take a long time / plan shows long diffs** — CloudFront
  distribution updates can take 5–15+ minutes to propagate; this is normal AWS behavior, not a
  script issue.
- **`smoke-test.sh` reports `HTTP Status: 403` or connection failures right after a fresh `apply`** —
  S3/CloudFront can take a short time to become consistent after creation; wait a minute and rerun.
- **Recreating the prod Route 53 zone changes nameservers** — since the hosted zone is
  conditionally created only for `prod`, tearing down and redeploying prod generates a *new* zone
  with new NS records. You'll need to update the domain registrar's nameservers to match, or your
  domain will stop resolving. Prefer never tearing down prod; use `dev` for cost experiments instead.
- **CI-specific**: `terraform-plan.yml` and `deploy.yml` both use static
  `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` secrets (not OIDC). Dependabot-authored PRs run under
  *Dependabot secrets*, which are separate from repo secrets — if a Dependabot PR's Terraform Plan
  check fails on AWS auth, make sure the same two secrets are also set under **Settings → Secrets and
  variables → Dependabot**.
