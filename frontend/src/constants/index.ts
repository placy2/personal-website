import k8sIcon from '../assets/kubernetes_logo.png';
import tfIcon from '../assets/terraform_logo.png';
import awsIcon from '../assets/aws_logo.png';
import adoIcon from '../assets/ado_logo.webp';
import helmIcon from '../assets/helm_logo.png';
import argoIcon from '../assets/argocd_logo.webp';

// Application constants. Single source for identity copy: the Home page,
// per-route meta tags (src/seo/head.ts), and JSON-LD all read from here.
export const APP_CONFIG = {
  name: 'Parker Lacy Portfolio',
  author: 'Parker Lacy',
  jobTitle: 'Senior DevOps / Platform Engineer',
  title: 'Parker Lacy - Senior DevOps / Platform Engineer',
  headline: 'Senior DevOps / Platform Engineer in Aurora, CO (Denver metro).',
  intro:
    'I work on the plumbing several dozen engineers rely on: clusters that scale themselves, build agents that patch and redeploy themselves every week, and audited access to production.',
  personal:
    "Outside of work, I'm a proud dad and husband, and can often be found spending time with family, out on the disc golf course, or enjoying a good videogame.",
  // Meta / Open Graph description. Keep it under ~160 characters so search
  // results and link previews don't truncate it.
  summary:
    'Senior DevOps / Platform Engineer in Aurora, CO (Denver metro), running Kubernetes, CI/CD, and access tooling for several dozen engineers.',
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
  SITE_REPO: 'https://github.com/placy2/personal-website',
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
