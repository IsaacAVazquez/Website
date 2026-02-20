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
    expect(badge).toHaveClass('bg-[var(--color-primary)]/10')
    expect(badge).toHaveClass('text-[var(--color-primary)]')
  })

  it('applies success variant correctly', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--color-success)]/10')
    expect(badge).toHaveClass('text-[var(--color-success)]')
  })

  it('applies warning variant correctly', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[var(--color-warning)]/10')
    expect(badge).toHaveClass('text-[var(--color-warning)]')
  })

  it('applies outline variant correctly', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('border-[var(--border-primary)]')
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
