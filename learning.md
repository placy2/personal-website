# Notes on various learning I undergo, particularly if I end up scrapping it from the repo itself.

## Github actions & Terraform state management
HCP terraform seems nice and provides some cool integrations, but ultimately it obfuscates too much and particularly for locals, it seems like it does not push up my entire application directory regardless of how I package/build it. Because it is much simpler to just run basic plan & apply commands as I would locally and configure an s3 backend to line up with AWS for now, that is probably the route I will proceed with.

Sample code of HCP plan PR pipeline, before deletion (highlight is the commenting on PR once completed with changes expected & a link):

Personally I prefer the more familiar `terraform init` workflow over uploading configuration. 

```yaml
name: "Terraform Plan"

on:
  pull_request:
    paths:
      - "terraform/**"
      - ".github/workflows/terraform-plan.yml"

env:
  TF_CLOUD_ORGANIZATION: "<ORG>"
  TF_API_TOKEN: "${{ secrets.HCP_TF_API_TOKEN }}"
  TF_WORKSPACE: "<WORKSPACE>"
  CONFIG_DIRECTORY: "./terraform"

jobs:
  terraform:
    name: "Terraform Plan"
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Upload Configuration
        uses: hashicorp/tfc-workflows-github/actions/upload-configuration@v1.0.0
        id: plan-upload
        with:
          workspace: ${{ env.TF_WORKSPACE }}
          directory: ${{ env.CONFIG_DIRECTORY }}
          speculative: true

      - name: Create Plan Run
        uses: hashicorp/tfc-workflows-github/actions/create-run@v1.0.0
        id: plan-run
        with:
          workspace: ${{ env.TF_WORKSPACE }}
          configuration_version: ${{ steps.plan-upload.outputs.configuration_version_id }}
          plan_only: true

      - name: Get Plan Output
        uses: hashicorp/tfc-workflows-github/actions/plan-output@v1.0.0
        id: plan-output
        with:
          plan: ${{ fromJSON(steps.plan-run.outputs.payload).data.relationships.plan.data.id }}

      - name: Update PR
        uses: actions/github-script@v6
        id: plan-comment
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            // 1. Retrieve existing bot comments for the PR
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            const botComment = comments.find(comment => {
              return comment.user.type === 'Bot' && comment.body.includes('Terraform Cloud Plan Output')
            });
            const output = `#### Terraform Cloud Plan Output
               \`\`\`
               Plan: ${{ steps.plan-output.outputs.add }} to add, ${{ steps.plan-output.outputs.change }} to change, ${{ steps.plan-output.outputs.destroy }} to destroy.
               \`\`\`
               [Terraform Cloud Plan](${{ steps.plan-run.outputs.run_link }})
               `;
            // 3. Delete previous comment so PR timeline makes sense
            if (botComment) {
              github.rest.issues.deleteComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: botComment.id,
              });
            }
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });
```