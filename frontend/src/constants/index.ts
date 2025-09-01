// Application constants
export const APP_CONFIG = {
  name: 'Parker Lacy Portfolio',
  title: 'Parker Lacy - Cloud/DevOps',
  description:
    'Cloud Engineer based in the Denver area. Passionate about technology, music, and family.',
  author: 'Parker Lacy',
  url: 'https://parkerlacy.com',
} as const;

// Navigation routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PROJECTS: '/projects',
  RESUME: '/resume',
} as const;

// External links
export const EXTERNAL_LINKS = {
  GITHUB: 'https://github.com/placy2',
  KUBERNETES: 'https://kubernetes.io/',
  TERRAFORM: 'https://www.terraform.io/',
  AWS: 'https://aws.amazon.com/',
  AZURE_DEVOPS: 'https://azure.microsoft.com/en-us/products/devops/pipelines/',
  HELM: 'https://helm.sh/',
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

// Technology stack
export const TECHNOLOGIES = [
  {
    name: 'Kubernetes',
    url: EXTERNAL_LINKS.KUBERNETES,
    icon: 'kubernetes_logo.png',
  },
  {
    name: 'Terraform',
    url: EXTERNAL_LINKS.TERRAFORM,
    icon: 'terraform_logo.png',
  },
  {
    name: 'AWS',
    url: EXTERNAL_LINKS.AWS,
    icon: 'aws_logo.png',
  },
  {
    name: 'Azure DevOps',
    url: EXTERNAL_LINKS.AZURE_DEVOPS,
    icon: 'ado_logo.webp',
  },
  {
    name: 'Helm',
    url: EXTERNAL_LINKS.HELM,
    icon: 'helm_logo.png',
  },
] as const;
