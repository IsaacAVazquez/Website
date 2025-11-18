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
    expect(badge).toHaveClass('bg-[#FF6B35]/20')
    expect(badge).toHaveClass('text-[#FF6B35]')
  })

  it('applies success variant correctly', () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[#6BCF7F]/20')
    expect(badge).toHaveClass('text-[#6BCF7F]')
  })

  it('applies warning variant correctly', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('bg-[#F7B32B]/20')
    expect(badge).toHaveClass('text-[#F7B32B]')
  })

  it('applies outline variant correctly', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('border-[#FFE4D6]')
  })

  it('applies default size (sm)', () => {
    const { container } = render(<Badge>Small</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-2.5')
    expect(badge).toHaveClass('py-0.5')
    expect(badge).toHaveClass('text-xs')
  })

  it('applies medium size correctly', () => {
    const { container } = render(<Badge size="md">Medium</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-3')
    expect(badge).toHaveClass('py-1')
    expect(badge).toHaveClass('text-sm')
  })

  it('applies large size correctly', () => {
    const { container } = render(<Badge size="lg">Large</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('px-4')
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
    expect(badge).toHaveClass('rounded-lg')
    expect(badge).toHaveClass('font-semibold')
  })

  it('is focusable with tabIndex', () => {
    const { container } = render(<Badge>Test</Badge>)
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveAttribute('tabIndex', '0')
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
