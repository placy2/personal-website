# AWS follow-up for GH #169 (web-filter/crawlability blocking)

## Context

GH #169 documented why parkerlacy.com was blocked by corporate web filters. The
highest-leverage fix — prerendering the four routes to real static HTML with proper
metadata, plus `robots.txt`/`sitemap.xml`/`security.txt` — landed in the PR this runbook
accompanies, entirely in application code and one additive Terraform diff (widening the S3
upload glob to include `.txt`/`.xml`).

Everything below requires changes to shared AWS infrastructure — DNS, CloudFront routing,
response headers, or the S3 origin model — and was deliberately kept out of that PR. These
carry real risk (DNS propagation, cert validation, changing how every request is routed)
and should be reviewed and applied on their own, not bundled with an app-code change.

**A correction to the original issue text:** finding #2 assumed a fix here was needed
before `/robots.txt`, `/sitemap.xml`, and `/.well-known/security.txt` would resolve.
That's not the case — those are exact-key S3 objects (`robots.txt`,
`.well-known/security.txt`), so the request path matches the object key exactly with no
SPA-fallback ambiguity. They already work as of the app-code PR, no CloudFront change
needed. What genuinely does need the fix below is `/about`, `/projects`, and `/resume`
loaded **directly** (not via client-side nav) — those are "directory-style" keys
(`about/index.html`), and a request for `/about` (no trailing slash) doesn't match that
key at all.

## What "direct load of a non-home route" actually does today

Verified during the app-code PR, correcting the issue's original "302 redirect to
`/about/`" assumption:

1. Browser requests `GET /about`.
2. S3 website endpoint (`aws_s3_bucket_website_configuration`) has no object literally
   named `about` — only `about/index.html` — so it returns **404**, not a redirect.
3. `custom_error_response` on the CloudFront distribution (`terraform/main.tf:83`) catches
   that 404 and serves `/index.html` — the **home page's** prerendered content — with a
   200.
4. The frontend's client-side guard (`data-prerendered-route` in `main.tsx`, added in the
   app-code PR) detects the mismatch and falls back to a plain client render instead of
   hydrating it, so there's no visible bug or console error for a real user. But a
   non-JS crawler fetching `/about` directly — e.g. one that discovered it via
   `sitemap.xml` — still sees the home page's title/description/content, not the About
   page's. That's a real, if bounded, gap: not a regression (today, *every* route shows
   this way), but it means the crawlability fix's benefit for GH #169 is currently
   realized for `/` only, not the other three routes, until item 3 below lands.

---

## 1. `www.parkerlacy.com` (issue finding #3)

**Risk: low.** Additive DNS + CloudFront alias; doesn't touch existing routing.

- `terraform/main.tf:150-161` (`aws_acm_certificate.cert`): add
  `subject_alternative_names = ["www.${var.domain_name}"]`. The commented-out line already
  there says exactly this.
- `terraform/main.tf:163-178` (`aws_route53_record.cert_validation`): the `for_each` already
  iterates `domain_validation_options`, which will now include the `www` SAN's validation
  record — no change needed, it picks it up automatically.
- `terraform/main.tf:106` (`aliases`): `[var.domain_name, "www.${var.domain_name}"]`.
- New `aws_route53_record` (A + AAAA, alias to the CloudFront distribution, same shape as
  the existing `aws_route53_record.site`) for `www.${var.domain_name}`.
- Redirect `www` → apex: cheapest option is a CloudFront Function on
  `viewer-request` that checks `Host == www.parkerlacy.com` and returns a 301 to the apex.
  (This is a natural first use of the CloudFront Function infrastructure item 3 also needs
  — consider landing them together.)

**Verify (read-only):** `dig www.parkerlacy.com` resolves; `terraform plan` shows only the
new cert SAN, alias, and DNS records — no resource replacement of the existing
distribution or cert (`create_before_destroy` on the cert should prevent that, but confirm
in the plan output before applying).

## 2. DNS trust records (issue finding #4)

**Risk: low for CAA/SPF/DMARC (additive TXT/CAA records). Medium for DNSSEC** — a
misconfigured DS record at the registrar can make the zone unresolvable; do this one
separately and verify propagation before moving on.

All in the prod-only Route 53 zone (`aws_route53_zone.zone`, `count = var.environment ==
"prod" ? 1 : 0`), so gate new resources on the same `count` expression, per
[[terraform/main.tf]]'s existing pattern (also matches the split-state work in issue #106).

```hcl
resource "aws_route53_record" "caa" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 3600
  records = ["0 issue \"amazonaws.com\""]
}

resource "aws_route53_record" "spf" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 -all"]
}

resource "aws_route53_record" "dmarc" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = aws_route53_zone.zone[0].zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600
  records = ["v=DMARC1; p=reject; rua=mailto:parkerlacy17@gmail.com"]
}
```

Double-check the CAA issuer string against what ACM actually validates with — the issue
suggested `"amazon.com"`, but ACM-issued certs commonly validate against
`"amazonaws.com"`; confirm against the live cert's issuer field
(`aws acm describe-certificate`) before applying, since a wrong CAA value would block the
next cert renewal.

DNSSEC: enable via `aws_route53_hosted_zone_dnssec` + a KSK
(`aws_route53_key_signing_key`, backed by a KMS key in `us-east-1`), then add the
resulting DS record at the domain registrar (outside Terraform/AWS — a manual step).
**Do this last**, after confirming the other DNS records above are live and correct, since
DNSSEC failures are the hardest of this group to unwind quickly.

**Verify (read-only):** `dig CAA/TXT/DNSKEY parkerlacy.com`; mail-tester.com or
`dig +short TXT _dmarc.parkerlacy.com` for the DMARC record specifically.

## 3. Real 404s + correct per-route fallback (issue finding #2, routing half)

**Risk: medium.** This changes what every request that isn't a literal S3 key resolves to
— get the CloudFront Function's route list wrong and a legitimate app route 404s for real
users.

Replace `custom_error_response` (`terraform/main.tf:83-88`, currently 404→200→
`/index.html` unconditionally) with a CloudFront Function on `viewer-request` that:

- Passes through requests for real files (anything with a `.` in the last path segment —
  covers `robots.txt`, `sitemap.xml`, `/assets/*`, `/.well-known/security.txt`, etc.)
  unmodified.
- Rewrites a request matching one of the known app routes (`/`, `/about`, `/projects`,
  `/resume` — keep this list in sync with `frontend/src/data/routeMeta.ts`) to
  `<route>/index.html`, so `/about` serves the About page's own prerendered file instead
  of falling back to home's.
- Lets everything else fall through to a real S3 404, which CloudFront now returns as a
  genuine 404 (drop the `custom_error_response` block, or narrow it to no longer remap to
  200).

This is also what makes the app-side `data-prerendered-route` mismatch guard
(`frontend/src/main.tsx`) stop being exercised in production — once every known route
serves its own file, the guard becomes a pure safety net rather than something that fires
on every direct `/about` load.

**Verify (read-only, against dev after deploy):**
`curl -o /dev/null -w '%{http_code}' https://<dev-url>/about` → 200 with About page
content (`curl ... | grep 'A little bit about me'`);
`curl -o /dev/null -w '%{http_code}' https://<dev-url>/definitely-not-a-real-page` → 404.

**Regression guard to add once this lands:** extend `scripts/smoke-test.sh` with a
known-bad-path check asserting a real 404 (see the placeholder note in that script's
history — GH #169's "Regression guard" section called this out explicitly).

## 4. CSP + Permissions-Policy (issue finding #5)

**Risk: low-medium.** The site loads no third-party resources today, so a strict CSP is
low-risk, but get the `script-src`/`style-src` values wrong and the app breaks silently in
production only (nothing catches a CSP violation in CI).

Replace the `data.aws_cloudfront_response_headers_policy.security_headers` (managed
baseline, `terraform/main.tf:71-73`) with an `aws_cloudfront_response_headers_policy`
resource:

- `content_security_policy`: `default-src 'self'; img-src 'self'; style-src 'self'
  'unsafe-inline'; script-src 'self'` (the `vite build` output is same-origin only, but
  confirm no inline `<script>` beyond the JSON-LD block — that one is `type="application/
  ld+json"`, not executable, so it's fine under this policy).
- `permissions_policy`: deny `camera`, `microphone`, `geolocation`.
- `strict_transport_security`: keep `max-age=31536000`, add `includeSubDomains` and
  `preload` (only add `preload` once you've verified the site works fully over HTTPS with
  no mixed content — preload-list submission is very hard to reverse).
- Drop `x-xss-protection` (deprecated, already flagged in the issue).

**Verify (read-only, against dev after deploy):** load the dev URL in a browser with
devtools open, confirm zero CSP violations in the console across all four routes;
`curl -I https://<dev-url>/ | grep -i content-security-policy`.

## 5. S3 → OAC private origin (issue finding #7)

**Risk: high — do this last, and only after item 3 is deployed and verified.** The
current setup depends on the S3 *website* endpoint's error-document behavior, which item 3
replaces with a CloudFront Function. Moving to a REST-API S3 origin + Origin Access
Control removes the website-endpoint layer entirely, so this only makes sense once
routing/fallback is handled at the CloudFront Function layer instead.

- `aws_s3_bucket_website_configuration` (`terraform/main.tf:59-69`) goes away.
- New `aws_cloudfront_origin_access_control`, and the distribution's `origin` block
  switches from `custom_origin_config` (HTTP, against the website endpoint) to
  `s3_origin_config` (or the newer `origin_access_control_id` field) against
  `aws_s3_bucket.bucket.bucket_regional_domain_name` directly.
- `aws_s3_bucket_public_access_block` (`terraform/main.tf:18-25`): flip
  `block_public_policy`/`restrict_public_buckets` to `true` now that CloudFront, not the
  public internet, is the only intended reader.
- `aws_s3_bucket_policy` (`terraform/main.tf:27-42`): replace the `Principal: "*"` public-read
  policy with one scoped to the CloudFront distribution's OAC (`Service:
  cloudfront.amazonaws.com` + `AWS:SourceArn` condition on the distribution ARN).

**Verify (read-only):** `curl http://<bucket>.s3-website-us-east-1.amazonaws.com/` should
403 or fail to connect once the website configuration is removed and the bucket is
private; the CloudFront URL should be unaffected. Confirm `terraform plan` shows the S3
policy and origin changing but does **not** show `aws_s3_bucket.bucket` itself being
replaced (that would mean data loss for the bucket's contents — there shouldn't be any
reason for a replace here, but it's the one diff in this whole runbook worth double- and
triple-checking before `apply`).

---

## Suggested order

1. **Item 1 (`www`) + item 2 (DNS records, DNSSEC last)** — small, independent, low-risk;
   land these first for quick wins.
2. **Item 3 (real 404s / correct routing)** — the one that actually completes GH #169's
   fix for `/about`, `/projects`, `/resume`. Landing this is also what triggers a
   re-crawl worth submitting the vendor recategorization requests after (see GH #169's
   "Not fixable in this repo" section — Zscaler, Netskope, Palo Alto, Cisco Talos,
   Forcepoint/Symantec, FortiGuard).
3. **Item 4 (CSP/Permissions-Policy)** — independent of the others, do whenever.
4. **Item 5 (S3 → OAC)** — last, and only after item 3 is live and verified in prod.

Each item's Terraform changes should go through the normal `./scripts/deploy.sh <env>
plan` review before `apply` — none of this was applied as part of researching this
runbook.
