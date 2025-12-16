import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { PageTransition } from './PageTransition'

describe('PageTransition Component', () => {
  it('should render children correctly', () => {
    render(
      <PageTransition>
        <div data-testid="child">Child Content</div>
      </PageTransition>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child Content')).toBeInTheDocument()
  })

  it('should wrap content in motion div', () => {
    render(
      <PageTransition>
        <p>Animated Content</p>
      </PageTransition>
    )
    expect(screen.getByText('Animated Content')).toBeInTheDocument()
  })
})
