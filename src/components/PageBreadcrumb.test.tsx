import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PageBreadcrumb } from './PageBreadcrumb'

const renderWithRouter = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PageBreadcrumb', () => {
  it('should render home link', () => {
    renderWithRouter(<PageBreadcrumb items={[{ label: 'Test' }]} />)
    
    const homeLink = screen.getByRole('link', { name: /início/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })

  it('should render single breadcrumb item as current page', () => {
    renderWithRouter(<PageBreadcrumb items={[{ label: 'Trilhas' }]} />)
    
    const currentPage = screen.getByText('Trilhas')
    expect(currentPage).toBeInTheDocument()
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })

  it('should render multiple breadcrumb items with links', () => {
    renderWithRouter(
      <PageBreadcrumb 
        items={[
          { label: 'Trilhas', href: '/trilhas' },
          { label: 'Alicerce', href: '/trilha/123' },
          { label: 'Curso Fundamentos' }
        ]} 
      />
    )
    
    // First two should be links
    const trilhasLink = screen.getByRole('link', { name: 'Trilhas' })
    expect(trilhasLink).toHaveAttribute('href', '/trilhas')

    const alicerceLink = screen.getByRole('link', { name: 'Alicerce' })
    expect(alicerceLink).toHaveAttribute('href', '/trilha/123')

    // Last should be current page (not a link)
    const currentPage = screen.getByText('Curso Fundamentos')
    expect(currentPage).toHaveAttribute('aria-current', 'page')
  })

  it('should render separators between items', () => {
    renderWithRouter(
      <PageBreadcrumb 
        items={[
          { label: 'Trilhas', href: '/trilhas' },
          { label: 'Curso' }
        ]} 
      />
    )
    
    // Should have 2 separators (after Home, and after Trilhas)
    const separators = document.querySelectorAll('[aria-hidden="true"]')
    expect(separators.length).toBeGreaterThanOrEqual(2)
  })

  it('should apply custom className', () => {
    const { container } = renderWithRouter(
      <PageBreadcrumb items={[{ label: 'Test' }]} className="custom-class" />
    )
    
    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('custom-class')
  })

  it('should truncate long labels', () => {
    renderWithRouter(
      <PageBreadcrumb 
        items={[{ label: 'Este é um título muito longo que deveria ser truncado para não quebrar o layout' }]} 
      />
    )
    
    const label = screen.getByText(/Este é um título muito longo/)
    expect(label).toHaveClass('truncate')
  })
})
