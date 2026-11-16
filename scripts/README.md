# Scripts

Helper scripts for local development and infrastructure management. `deploy.sh` and `teardown.sh`
are thin wrappers around the Terraform configuration in `../terraform`. `upload-site.sh` uploads the
built site to the bucket; Terraform does not manage site objects. All of them can be run from
anywhere in the repo (they resolve paths relative to their own location).

## Prerequisites

### For infrastructure scripts (`deploy.sh`, `teardown.sh`, `upload-site.sh`)

- **Terraform** `>= 1.13.5` (matches `terraform/provider.tf`) on your `PATH`.
- **AWS credentials** resolvable via the standard AWS provider chain — one of:
  - `~/.aws/credentials` / `~/.aws/config` (e.g. via `aws configure` or `aws sso login`), or
  - Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and optionally
    `AWS_SESSION_TOKEN`, or
  - `AWS_PROFILE` pointing at a named profile.
  - The credentials need permissions on S3 (bucket + object management), CloudFront (incl.
    origin access controls and invalidations), and Route 53 + ACM (prod only), plus read/write
    access to the remote state bucket (see below).
- **AWS CLI v2** on your `PATH`, for `upload-site.sh` (`aws s3 sync`/`cp`, `aws cloudfront`).
- **Remote state bucket** `parker-terraform-backends` (hardcoded in `terraform/provider.tf`) must
  already exist in `us-east-1` and be accessible to your credentials. These scripts do not create it.
- **Node.js + npm**, only if `frontend/dist` doesn't exist yet — `deploy.sh` will run
  `npm run build` for you in that case.

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
./scripts/deploy.sh prod apply   # deploy prod (infra, then site content)
```

Deploys normally go through `deploy.yml`, not this script. Don't apply dev from a workstation.

What it does, in order:
1. `cd`s into `../terraform`.
2. Runs `terraform init -reconfigure -backend-config="env/${environment}.s3.tfbackend"`. The
   `-reconfigure` + per-environment backend file combo is intentional: state for `dev` and `prod`
   live under different keys in the same S3 bucket (see `terraform/env/*.s3.tfbackend`), so the
   backend must be re-pointed every time you switch environments in the same working directory.
   Skipping this (or reusing a stale `.terraform/` dir) is the most common cause of "wrong
   environment" mistakes.
3. Runs the requested `terraform` action with `-var-file="env/${environment}.tfvars"`.
   `apply` and `destroy` both pass `-auto-approve` — there is no interactive confirmation, so double
   check `environment`/`action` before running, especially for `prod`.
4. `apply` only: builds the frontend first if `../frontend/dist` doesn't exist, and after Terraform
   finishes runs `upload-site.sh` with the bucket and distribution from `terraform output`.
   `plan` and `destroy` don't need a build: Terraform no longer reads `dist/`.

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

Intended for cost control on the `dev` environment (a bucket and a CloudFront distribution with no
custom domain; deleting the distribution takes several minutes because CloudFront disables it
first). The dev bucket has `force_destroy = true`, since Terraform no longer tracks the site objects
and would otherwise refuse to delete a non-empty bucket. The prod bucket does not: a prod teardown
fails at the bucket until you empty it by hand, which is deliberate. A prod teardown would also take
down the live site and (since `aws_route53_zone` is only created `count = var.environment ==
"prod" ? 1 : 0`, with `prevent_destroy`) the Route 53 hosted zone — recreating a hosted zone means
new nameservers, which you'd need to update at your domain registrar. Avoid tearing down prod
casually.

### `upload-site.sh` — upload `frontend/dist` and invalidate CloudFront

```bash
./scripts/upload-site.sh <bucket> [distribution-id] [dist-dir]
```

Run after `terraform apply` (CI and `deploy.sh apply` do this for you). It sets the same headers
Terraform used to set per object:

| Files                  | Cache-Control                         |
|------------------------|---------------------------------------|
| `*.html` (anywhere)    | `no-cache`                            |
| `assets/**` (non-HTML) | `public, max-age=31536000, immutable` |
| everything else        | `public, max-age=86400`               |

Content-Type comes from an explicit extension map in the script, not the AWS CLI's guess. A file with
no extension or an unmapped one fails the upload before anything is sent; add it to
`content_type_for` in the script.

Order: hashed `assets/` first (sync, never deleted, so tabs and caches holding old HTML can still
load old chunks), then other non-HTML files, then HTML, then a `sync --delete` that prunes files no
longer in the build outside `assets/`. With a distribution ID it then creates a `/*` invalidation
and waits for it. Old hashed assets accumulate in the bucket. They're small, so nothing prunes them yet. A
follow-up is planned: an age- or build-based prune of `assets/` (for example, keep what the last
N builds reference). It is not built.

### `smoke-test.sh` — post-deploy validation against a live URL

```bash
./scripts/smoke-test.sh <url> [s3-direct-url]
```

Example:
```bash
./scripts/smoke-test.sh https://<cloudfront-domain>.cloudfront.net
./scripts/smoke-test.sh https://<cloudfront-domain>.cloudfront.net https://parkerlacy-dev-hosting.s3.us-east-1.amazonaws.com
```

Runs against `terraform output cloudfront_url` in both environments (and the live domain in prod).
The optional second argument is `terraform output s3_direct_url`; CI passes it only when
`terraform output origin_private` is `true` (after cutover phase 2). See the deploy workflow's
"Read Terraform outputs" steps.

Checks performed (exit code `0` unless the hard checks below fail):
- **HTTP 200** status (hard failure if not 200, or if `curl` can't connect at all).
- **Response time** (informational only).
- **Expected content markers** present in the HTML (`"Parker Lacy"`, `"DevOps"`, `"Cloud"`) — soft
  failure: logs a warning but does not exit non-zero, since copy changes shouldn't break the build.
- **Valid HTML structure** (`<!doctype html>` + `</html>`) — hard failure.
- **React root container** (`id="root"`) present — soft failure.
- **Crawlable content**: meta description present, `#root` not empty — hard failure.
- **`robots.txt`** (200, `text/plain`, has `Sitemap:`) and **`sitemap.xml`** (200, XML) — hard failure.
- **Every sitemap route** returns 200 directly (no redirect) with its own prerendered page — hard failure.
- **Unknown path** returns 404 with an HTML body — hard failure.
- **Cache-Control**: `no-cache` on `/`, `public, max-age=31536000, immutable` on an `/assets/` file
  linked from the home page — hard failure.
- **`/projects` and `/projects/`** return 301 to `/work` — hard failure.
- **Direct S3 read** of `index.html` returns 403 — hard failure; only when `s3-direct-url` is given.

Browser-level checks live in the Playwright suite under `frontend/e2e/` (`npm run test:e2e`).

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
- **State lock errors** — state uses S3-native locking (`use_lockfile = true` in
  `terraform/provider.tf`), and the scripts pass `-lock-timeout=5m`. A lock held by CI or another
  run makes Terraform wait, then fail. Wait for the other run to finish rather than forcing unlock.
  If you initialized before locking was enabled, re-run `terraform init -reconfigure`.
- **CloudFront changes in `prod` "apply" take a long time / plan shows long diffs** — CloudFront
  distribution updates can take 5–15+ minutes to propagate; this is normal AWS behavior, not a
  script issue.
- **`smoke-test.sh` reports `HTTP Status: 403` or connection failures right after a fresh `apply`** —
  S3/CloudFront can take a short time to become consistent after creation; wait a minute and rerun.
  A 403 that persists (often on every unknown path, or on every page) means CloudFront isn't being
  admitted by the bucket policy: check the distribution has the origin access control attached and
  that the policy's `AWS:SourceArn` matches this distribution's ARN. CloudFront serves 403s as S3's
  XML error on purpose, so this stays visible instead of looking like a 404.
- **`upload-site.sh` fails with "Files with no known Content-Type"** — the build emitted a new file
  type. Add its extension to `content_type_for` in the script rather than letting the AWS CLI guess.
- **Recreating the prod Route 53 zone changes nameservers** — since the hosted zone is
  conditionally created only for `prod`, tearing down and redeploying prod generates a *new* zone
  with new NS records. You'll need to update the domain registrar's nameservers to match, or your
  domain will stop resolving. Prefer never tearing down prod; use `dev` for cost experiments instead.
- **CI-specific**: `terraform-plan.yml`, `deploy.yml` and `cleanup.yml` authenticate to AWS via GitHub
  OIDC (`aws-actions/configure-aws-credentials` with the `AWS_DEPLOY_ROLE_ARN` secret), not static
  keys. The role and OIDC provider live in the separate `aws-infra` repo. Dependabot-authored PRs run
  under *Dependabot secrets*, which are separate from repo secrets — if a Dependabot PR's Terraform
  Plan check fails on AWS auth, set `AWS_DEPLOY_ROLE_ARN` under **Settings → Secrets and variables →
  Dependabot** too (the role's trust policy must also allow that run).
