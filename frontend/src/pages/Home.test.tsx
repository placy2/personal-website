import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '../pages/Home'

describe('Home Component', () => {
  it('renders Parker Lacy heading', () => {
    render(<Home />)
    expect(screen.getByRole('heading', { name: /parker lacy/i })).toBeInTheDocument()
  })

  it('displays professional description', () => {
    render(<Home />)
    expect(screen.getByText(/cloud engineer based in the denver area/i)).toBeInTheDocument()
  })

  it('shows technology icons', () => {
    render(<Home />)
    expect(screen.getByAltText('Kubernetes')).toBeInTheDocument()
    expect(screen.getByAltText('Terraform')).toBeInTheDocument()
    expect(screen.getByAltText('AWS')).toBeInTheDocument()
  })

  it('has links to external resources', () => {
    render(<Home />)
    const kubernetesLink = screen.getByRole('link', { name: /kubernetes/i })
    expect(kubernetesLink).toHaveAttribute('href', 'https://kubernetes.io/')
    expect(kubernetesLink).toHaveAttribute('target', '_blank')
  })
})