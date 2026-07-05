import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--home-signal)]/10')
    expect(badge).toHaveClass('text-[var(--home-signal)]')
  })

  it('applies success variant correctly', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--home-positive)]/10')
    expect(badge).toHaveClass('text-[var(--home-positive)]')
  })

  it('applies warning variant correctly', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--home-warning)]/10')
    expect(badge).toHaveClass('text-[var(--home-warning)]')
  })

  it('applies outline variant correctly', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('border-[var(--home-rule)]')
  })

  it('applies error variant correctly', () => {
    const { container } = render(<Badge variant="error">Error</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--home-negative)]/10')
    expect(badge).toHaveClass('text-[var(--home-negative)]')
  })

  it('applies default size (sm)', () => {
    const { container } = render(<Badge>Small</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-2')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
  })

  it('applies medium size correctly', () => {
    const { container } = render(<Badge size="md">Medium</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-2.5')
    expect(badge).toHaveClass('py-1')
    expect(badge).toHaveClass('text-sm')
  })

  it('applies large size correctly', () => {
    const { container } = render(<Badge size="lg">Large</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-3')
    expect(badge).toHaveClass('py-1.5')
    expect(badge).toHaveClass('text-base')
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('custom-class')
  })

  it('has proper base classes', () => {
    const { container } = render(<Badge>Test</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('inline-flex')
    expect(badge).toHaveClass('items-center')
    expect(badge).toHaveClass('rounded-md')
    expect(badge).toHaveClass('font-medium')
  })

  it('renders as a span, not a div — Badge is an inline status token', () => {
    const { container } = render(<Badge>Test</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge.tagName).toBe('SPAN')
  })

  it('forwards additional props', () => {
    const { container } = render(
      <Badge data-testid="test-badge" aria-label="Test">
        Test
      </Badge>
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveAttribute('data-testid', 'test-badge')
    expect(badge).toHaveAttribute('aria-label', 'Test')
  })
})
