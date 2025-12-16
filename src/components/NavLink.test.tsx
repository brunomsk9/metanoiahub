import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { NavLink } from './NavLink'

describe('NavLink Component', () => {
  it('should render correctly', () => {
    render(<NavLink to="/test">Test Link</NavLink>)
    const link = screen.getByRole('link', { name: /test link/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should apply custom className', () => {
    render(
      <NavLink to="/test" className="custom-class">
        Test Link
      </NavLink>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('custom-class')
  })

  it('should render children correctly', () => {
    render(
      <NavLink to="/test">
        <span data-testid="child">Child Element</span>
      </NavLink>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
