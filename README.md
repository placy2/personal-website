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
![Terraform ≥1.13](https://img.shields.io/badge/Terraform-%E2%89%A51.13-844FBA?logo=terraform&logoColor=white)
![AWS S3 + CloudFront](https://img.shields.io/badge/AWS-S3%20%2B%20CloudFront-232F3E?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xOS4zNSAxMC4wNEE3LjQ5IDcuNDkgMCAwIDAgMTIgNEM5LjExIDQgNi42IDUuNjQgNS4zNSA4LjA0QTUuOTk0IDUuOTk0IDAgMCAwIDAgMTRjMCAzLjMxIDIuNjkgNiA2IDZoMTNjMi43NiAwIDUtMi4yNCA1LTUgMC0yLjY0LTIuMDUtNC43OC00LjY1LTQuOTZ6Ii8+PC9zdmc+)

An evolving personal portfolio website for [parkerlacy.com](https://parkerlacy.com), showcasing cloud engineering expertise with a focus on modern development practices and cost-effective infrastructure.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev

# View at http://localhost:5173
```

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: CSS with custom properties
- **Infrastructure**: AWS S3 + CloudFront + Route 53
- **IaC**: Terraform with environment-specific configurations
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Testing**: Vitest + React Testing Library (unit), Playwright (e2e against the production build), Lighthouse CI (perf/a11y/SEO)

## 📁 Project Structure

```
personal-website/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── constants/      # Shared constants
│   │   └── stylesheets/    # CSS files
│   ├── public/             # Static assets
│   └── dist/              # Build output
├── terraform/              # Infrastructure as Code
│   ├── *.tf               # Terraform configuration
│   ├── dev.tfvars        # Development environment
│   └── prod.tfvars       # Production environment
├── scripts/               # Helper scripts
└── .github/              # CI/CD workflows
```

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build using vite
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
```

#### Infrastructure
```bash
./scripts/deploy.sh dev plan      # Plan development deployment
./scripts/deploy.sh dev apply     # Deploy to development
./scripts/deploy.sh prod plan     # Plan production deployment
./scripts/deploy.sh prod apply    # Deploy to production
./scripts/teardown.sh dev         # Destroy development infrastructure
./scripts/smoke-test.sh <url>     # Run smoke tests against deployed site
```

See [`scripts/README.md`](scripts/README.md) for full usage details, expected environment/AWS
setup, and troubleshooting tips for each script.

### Environment Configuration

Copy `.env.example` to `.env.local` and customize:

```bash
cp .env.example .env.local
```

## 🌍 Environments

### Development
- **S3 Only**: No CloudFront for cost savings
- **Bucket**: `parkerlacy-dev-hosting`
- **Domain**: S3 website endpoint

### Production
- **Full Stack**: S3 + CloudFront + Route 53
- **Bucket**: `parkerlacy-website-hosting-bucket`
- **Domain**: `parkerlacy.com`

## 📋 Infrastructure Management

### Cost-Optimized Development
```bash
# Deploy minimal infrastructure (S3 only)
./scripts/deploy.sh dev apply

# Quickly tear down to save costs
./scripts/teardown.sh dev
```

### Production Deployment
```bash
# Deploy full infrastructure (S3 + CloudFront + Route 53)
./scripts/deploy.sh prod apply
```

### Manual Terraform Commands
```bash
cd terraform

# Initialize with the state key for the target environment (dev or prod)
terraform init -reconfigure -backend-config=env/dev.s3.tfbackend

# Plan with environment-specific variables
terraform plan -lock-timeout=5m -var-file="env/dev.tfvars"

# Apply changes
terraform apply -lock-timeout=5m -var-file="env/dev.tfvars"

# Destroy infrastructure
terraform destroy -lock-timeout=5m -var-file="env/dev.tfvars"
```

**State locking:** the S3 backend uses S3-native locking (`use_lockfile = true`), so a
run waits for (or fails on) a lock held by CI or another user instead of clobbering state.
`-lock-timeout=5m` makes Terraform wait for the lock rather than failing immediately.
If you initialized `terraform/` before locking was enabled, re-run
`terraform init -reconfigure -backend-config=env/<env>.s3.tfbackend` once after pulling.

## 🔧 Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

### Writing Tests
Tests are written using Vitest and React Testing Library. Examples can be found in:
- `src/App.test.tsx`
- `src/pages/Home.test.tsx`

### Smoke Tests
Post-deployment smoke tests validate that the deployed site is functional:

```bash
# Run smoke tests against development
./scripts/smoke-test.sh http://parkerlacy-dev-hosting.s3-website-us-east-1.amazonaws.com

# Run smoke tests against production
./scripts/smoke-test.sh https://<cloudfront-domain>.cloudfront.net
```

The smoke tests verify:
- HTTP 200 status response
- Expected content is present (name, key technologies)
- Valid HTML structure
- React app container exists

These tests run automatically in the CI/CD pipeline after each deployment.

For more comprehensive end-to-end testing, see the Playwright implementation suggestions in `scripts/smoke-test.sh`.

## 🚀 Deployment

### Automated (GitHub Actions)
- **Pull Requests**: Automatically test and plan infrastructure changes
- **Main Branch**: Deploy to development environment
- **Production**: Manual approval required via GitHub environments

### Manual Deployment
```bash
# Build frontend
cd frontend && npm run build

# Deploy infrastructure
./scripts/deploy.sh prod apply
```

## 🔒 Security

- Dependabot for automated dependency updates
- Security scanning in CI/CD pipeline
- Least privilege AWS IAM policies
- HTTPS everywhere with CloudFront

## 🎨 Code Quality

- **ESLint**: Code linting with TypeScript support
- **Prettier**: Consistent code formatting
- **TypeScript**: Type safety and better development experience
- **Testing**: Comprehensive test coverage with Vitest
- **Pre-commit hooks**: Husky + lint-staged run ESLint and Prettier on staged files before each commit (activated automatically by `npm install` in `frontend/`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

- Code (source): MIT License — see LICENSE (recommended for code, components, scripts).
- Personal content (résumé text, biography, original images, etc.): All Rights Reserved — see CONTENT_LICENSE.md.

This separation keeps code permissively licensed while preventing reuse of personal content without permission.


---

**Focus**: Easy local development + Simple cloud cost management + Industry best practices