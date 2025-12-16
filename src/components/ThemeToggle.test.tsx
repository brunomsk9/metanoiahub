import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { ThemeToggle } from './ThemeToggle'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('ThemeToggle Component', () => {
  it('should render correctly', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should be clickable', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(() => fireEvent.click(button)).not.toThrow()
  })

  it('should have accessible label', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAccessibleName()
  })
})
