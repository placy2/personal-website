# Personal Website

An evolving personal portfolio website for [parkerlacy.com](https://parkerlacy.com), showcasing cloud engineering expertise with a focus on modern development practices and cost-effective infrastructure.

## 🚀 Quick Start

### With Docker (Recommended)
```bash
# One-command setup
./scripts/dev-setup.sh

# Or manually
docker-compose up --build

# View at http://localhost:5173
```

### Traditional Development
```bash
cd frontend
npm install
npm run dev

# View at http://localhost:5173
```

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS with custom properties
- **Infrastructure**: AWS S3 + CloudFront + Route 53
- **IaC**: Terraform with environment-specific configurations
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Testing**: Vitest + React Testing Library
- **Containerization Options**: Docker Compose w/ dev & prod configuration options

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
```

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

# Initialize
terraform init

# Plan with environment-specific variables
terraform plan -var-file="dev.tfvars"

# Apply changes
terraform apply -var-file="dev.tfvars"

# Destroy infrastructure
terraform destroy -var-file="dev.tfvars"
```

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
- **Pre-commit hooks**: Planned for future implementation

## 📦 Docker

### Development
```dockerfile
# Dockerfile.dev - Hot reloading with volume mounts
docker-compose up
```

### Production
```dockerfile
# Dockerfile - Optimized production build
docker-compose -f docker-compose.prod.yml up
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is personal and proprietary to Parker Lacy.

---

**Focus**: Easy local development + Simple cloud cost management + Industry best practices