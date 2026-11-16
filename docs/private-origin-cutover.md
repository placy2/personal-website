# Private S3 origin (OAC) cutover

How the site moves from a public S3 *website* endpoint to a private bucket that only CloudFront can
read, through Origin Access Control (OAC). This is item 5 of
[`web-filter-remediation-aws.md`](web-filter-remediation-aws.md).

The cutover takes two applies, in both environments. The `allow_public_read` variable selects the
phase.

## Why two phases

One apply cannot promise zero downtime:

- The distribution update (origin moves to the bucket's REST endpoint, requests are signed with
  OAC) takes minutes to reach every edge. Until then, some edges still fetch from the public website
  endpoint.
- Locking the bucket (public access block plus a CloudFront-only policy) takes effect at once.

If both happen in one apply, edges that haven't switched yet lose access. The provider does wait for
the distribution to reach `Deployed`, and the public access block `depends_on` the distribution.
But a lock-down that relies only on that wait has no safe rollback once it has run. Two phases keep
every step reversible and give a clear verification point in between.

## Phase 1: switch the origin, keep public access (`allow_public_read = true`)

This is the PR that adds OAC. Both `env/*.tfvars` set `allow_public_read = true`.

The apply, in dependency order:

1. Creates `aws_cloudfront_origin_access_control.site`.
2. Updates the distribution: the origin becomes `bucket_regional_domain_name` with the OAC
   attached, `custom_origin_config` goes away, and `custom_error_response` (404 -> `/index.html`,
   status kept at 404) is added. The provider returns only when the distribution is `Deployed`.
3. Public access block: no change (`block_public_policy` and `restrict_public_buckets` stay false).
4. Bucket policy: adds the CloudFront statements (`s3:GetObject` on `bucket/*`, `s3:ListBucket` on
   the bucket, both conditioned on `AWS:SourceArn` = this distribution). Keeps `PublicReadGetObject`.
5. Keeps the S3 website configuration, which now serves nothing.
6. Forgets `aws_s3_object.file` (the `removed` block, `destroy = false`). No object is deleted.
   `scripts/upload-site.sh` then re-uploads the build with the same headers.

Dev also gets its first distribution here, with no custom domain. Creating it takes several minutes.

**Known transient (phase 1 only):** while step 2 propagates, edges already on the REST origin are
covered by the public `GetObject` grant, so every real page works. But `ListBucket` isn't granted
until step 4, so an *unknown* path can return 403 (S3's XML error) instead of 404 at those edges,
for a few minutes. Real pages are unaffected.

### Verify before phase 2

1. The deploy workflow's smoke tests passed for both environments. Test 13 (direct S3 read) is
   skipped in this phase, as expected.
2. The distribution is deployed and signing:

   ```bash
   aws cloudfront get-distribution --id <id> \
     --query 'Distribution.{Status:Status,Origin:DistributionConfig.Origins.Items[0].[DomainName,OriginAccessControlId]}'
   ```

   Expect `Deployed`, `<bucket>.s3.us-east-1.amazonaws.com`, and a non-empty OAC ID.
3. `curl -sI https://<site>/definitely-not-a-page` returns `404` with `content-type: text/html`.

### Rolling back phase 1

Do **not** `git revert` the whole PR. It also removed the `enable_cloudfront` count and added
`moved` blocks, so a plain revert would plan to **replace** the prod distribution. Roll back by
restoring only the distribution's `origin` block to the website endpoint
(`aws_s3_bucket_website_configuration.hosting[0].website_endpoint` with the old
`custom_origin_config`, no `origin_access_control_id`). The public grant and website configuration
are still there in phase 1, so that alone restores the old serving path.

## Phase 2: lock the bucket (`allow_public_read` removed)

This is a follow-up PR that deletes the `allow_public_read = true` line from both `env/*.tfvars`.
Merge it only after phase 1 is verified in **prod**.

The apply:

1. Public access block: all four settings become `true`. From this moment `RestrictPublicBuckets`
   ignores the `Principal: "*"` statement. CloudFront keeps working, because it is an AWS service
   principal with its own statement in the policy.
2. Bucket policy (`depends_on` the public access block): drops `PublicReadGetObject`. The remaining
   policy is not public, so `BlockPublicPolicy` accepts it.
3. Deletes the S3 website configuration.

Nothing in phase 2 touches the distribution, so there is no propagation window. After this, the
deploy workflow passes `s3_direct_url` to the smoke tests (because `origin_private` is now `true`),
and Test 13 asserts that the bucket returns 403 to direct reads.

**Rolling back phase 2:** revert the phase 2 PR. That restores the public grant and website
configuration. Nothing serves from them, so this changes nothing for visitors.

## New environments

Leave `allow_public_read` unset (it defaults to `false`). A fresh apply creates the bucket and the
distribution, and only then the public access block and the policy (both depend on the
distribution). Then run `scripts/upload-site.sh`.
