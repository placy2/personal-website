import k8sIcon from '../assets/kubernetes_logo.png';
import tfIcon from '../assets/terraform_logo.png';
import awsIcon from '../assets/aws_logo.png';
import adoIcon from '../assets/ado_logo.webp';
import helmIcon from '../assets/helm_logo.png';
import argoIcon from '../assets/argocd_logo.webp';

// Application constants
export const APP_CONFIG = {
  name: 'Parker Lacy Portfolio',
  title: 'Parker Lacy - Cloud/DevOps',
  description: [
    'Senior Cloud Engineer based in the Denver area. Proud dad, husband, and technology enthusiast.',
    'I enjoy supporting development teams in building and maintaining cloud infrastructure, CI/CD pipelines, and automation solutions.',
    'Outside of work, I can often be found spending time with family, out on the disc golf course, or enjoying a good videogame.',
  ],
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
  ARGOCD: 'https://argo-cd.readthedocs.io/en/stable/',
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
    icon: k8sIcon,
  },
  {
    name: 'Terraform',
    url: EXTERNAL_LINKS.TERRAFORM,
    icon: tfIcon,
  },
  {
    name: 'AWS',
    url: EXTERNAL_LINKS.AWS,
    icon: awsIcon,
  },
  {
    name: 'Azure DevOps',
    url: EXTERNAL_LINKS.AZURE_DEVOPS,
    icon: adoIcon,
  },
  {
    name: 'Helm',
    url: EXTERNAL_LINKS.HELM,
    icon: helmIcon,
  },
  {
    name: 'ArgoCD',
    url: EXTERNAL_LINKS.ARGOCD,
    icon: argoIcon,
  },
] as const;
