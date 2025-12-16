import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card Component', () => {
  it('should render Card correctly', () => {
    render(<Card data-testid="card">Card Content</Card>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should render CardHeader correctly', () => {
    render(<CardHeader data-testid="card-header">Header</CardHeader>)
    expect(screen.getByTestId('card-header')).toBeInTheDocument()
  })

  it('should render CardTitle correctly', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('should render CardDescription correctly', () => {
    render(<CardDescription>Description text</CardDescription>)
    expect(screen.getByText('Description text')).toBeInTheDocument()
  })

  it('should render CardContent correctly', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>)
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
  })

  it('should render CardFooter correctly', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>)
    expect(screen.getByTestId('card-footer')).toBeInTheDocument()
  })

  it('should render complete Card structure', () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>This is a test card</CardDescription>
        </CardHeader>
        <CardContent>Card body content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>
    )

    expect(screen.getByTestId('full-card')).toBeInTheDocument()
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('This is a test card')).toBeInTheDocument()
    expect(screen.getByText('Card body content')).toBeInTheDocument()
    expect(screen.getByText('Card footer')).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    render(<Card className="custom-card-class" data-testid="card" />)
    expect(screen.getByTestId('card')).toHaveClass('custom-card-class')
  })
})
