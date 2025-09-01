# personal-website
An evolving repo with the goal of publishing a 'resume' site of some sort to parkerlacy.com. This is likely to be a pretty piecemeal process with lots of notetaking and learning about hosting, as well as configuring IaC with a cloud provider &amp; deciding on how to configure the React app.

# React Setup Documentation

This application is built with Vite + React configured as a statically-served website.

## Project Structure

The React application is located in the `/frontend` directory. The main files and directories include:
- `/src`: Contains the source code for the React application.
- `/public`: Contains static assets such as images and the `index.html` file.
- `vite.config.js`: Configuration file for Vite.
- `package.json`: Lists the project dependencies and scripts.

## Local Development

To debug this application locally, navigate to the `/frontend` directory.

Then, you can debug the app or build it locally using the following commands:

```sh
# Install Node dependencies
npm install

# Debug with Hot Module Replacement
npm run dev

# Build the project into /frontend/dist
npm run build

# Preview the built project from /frontend/dist served locally
npm run preview
```

## Environment Variables

You can configure environment variables for different environments by creating `.env` files in the `/frontend` directory. For example:
- `.env`: Default environment variables.
- `.env.development`: Variables for the development environment.
- `.env.production`: Variables for the production environment.

## Deployment

After building the project, the static files will be located in the `/frontend/dist` directory. These files can be deployed to the S3 bucket configured in the Terraform setup. You can use the AWS CLI to sync the files locally:

```sh
aws s3 sync /frontend/dist s3://your-s3-bucket-name
```

Make sure to replace `your-s3-bucket-name` with the actual name of your S3 bucket.

## Additional Resources

- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

# Terraform Setup Documentation

## Overview
This Terraform setup is designed to provision and manage the infrastructure required to host a static website on AWS. The configuration includes resources for an S3 bucket to store the website files, a CloudFront distribution for content delivery, and a Route 53 hosted zone for DNS management.

## Resources
- **S3 Bucket**: Stores the static website files.
- **S3 Bucket Policy**: Configures public access to the S3 bucket.
- **S3 Bucket Website Configuration**: Sets up the S3 bucket to serve as a static website.
- **CloudFront Distribution**: Distributes the website content globally with low latency.
- **Route 53 Hosted Zone**: Manages the DNS records for the domain.

## Running Terraform Commands Locally

1. **Initialize Terraform**:
    ```sh
    terraform init
    ```

2. **Plan the Infrastructure Changes**:
    ```sh
    terraform plan
    ```

3. **Apply the Infrastructure Changes**:
    ```sh
    terraform apply
    ```

4. **Destroy the Infrastructure** (if needed):
    ```sh
    terraform destroy
    ```

Make sure to configure your AWS credentials before running these commands. You can do this by setting the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables or by using the AWS CLI configuration.


# GitHub Actions Documentation

## Workflows

### 1. `terraform-basic-apply.yml`

This workflow is triggered by a repository dispatch event of type `terraform-apply`. It performs the following steps:
- Checks out the repository.
- Downloads the build artifact from the `react-deploy.yml` workflow.
- Configures AWS credentials.
- Sets up Terraform.
- Initializes Terraform.
- Applies the Terraform configuration to provision infrastructure.

### 2. `terraform-basic-plan.yml`

This workflow is triggered by a workflow dispatch event or a pull request affecting the Terraform configuration or the workflow file itself. It performs the following steps:
- Checks out the repository.
- Downloads the build artifact from the `react-deploy.yml` workflow.
- Configures AWS credentials.
- Sets up Terraform.
- Initializes Terraform.
- Plans the Terraform configuration to show the changes that would be applied.

### 3. `react-deploy.yml`

This workflow is triggered by a push to the `main` branch or changes in the frontend directory or workflow files. It performs the following steps:
- Checks out the repository.
- Sets up Node.js.
- Installs dependencies.
- Builds the project.
- Publishes the build artifact.
- Triggers the `terraform-apply` workflow.

### 4. `terraform-destroy.yml`

This workflow is triggered manually via workflow dispatch. It performs the following steps:
- Checks out the repository.
- Configures AWS credentials.
- Sets up Terraform.
- Initializes Terraform.
- Plans the destruction of the Terraform-managed infrastructure.
- Waits for manual approval.
- Destroys the Terraform-managed infrastructure.