import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModernButton } from '../ModernButton'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}))

describe('ModernButton', () => {
  it('renders children correctly', () => {
    render(<ModernButton>Click me</ModernButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies default variant (primary)', () => {
    render(<ModernButton>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('bg-[#FF6B35]')
    expect(button).toHaveClass('text-white')
  })

  it('applies secondary variant correctly', () => {
    render(<ModernButton variant="secondary">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('bg-[#F7B32B]')
  })

  it('applies outline variant correctly', () => {
    render(<ModernButton variant="outline">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('border-2')
    expect(button).toHaveClass('border-[#FF6B35]')
  })

  it('applies ghost variant correctly', () => {
    render(<ModernButton variant="ghost">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('text-[#6B4F3D]')
  })

  it('applies default size (md)', () => {
    render(<ModernButton>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('px-6')
    expect(button).toHaveClass('py-3')
    expect(button).toHaveClass('min-h-[44px]')
  })

  it('applies small size correctly', () => {
    render(<ModernButton size="sm">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('px-4')
    expect(button).toHaveClass('py-2')
    expect(button).toHaveClass('min-h-[40px]')
  })

  it('applies large size correctly', () => {
    render(<ModernButton size="lg">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('px-8')
    expect(button).toHaveClass('py-4')
    expect(button).toHaveClass('min-h-[52px]')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<ModernButton onClick={handleClick}>Click me</ModernButton>)
    const button = screen.getByText('Click me')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<ModernButton disabled>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
    expect(button).toHaveClass('disabled:cursor-not-allowed')
  })

  it('does not trigger onClick when disabled', () => {
    const handleClick = jest.fn()
    render(
      <ModernButton disabled onClick={handleClick}>
        Button
      </ModernButton>
    )
    const button = screen.getByText('Button')
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies fullWidth prop correctly', () => {
    render(<ModernButton fullWidth>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('w-full')
  })

  it('applies custom className', () => {
    render(<ModernButton className="custom-class">Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('custom-class')
  })

  it('has correct ARIA label', () => {
    render(<ModernButton ariaLabel="Submit form">Submit</ModernButton>)
    const button = screen.getByText('Submit')
    expect(button).toHaveAttribute('aria-label', 'Submit form')
  })

  it('has proper focus styles', () => {
    render(<ModernButton>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('focus-visible:outline-none')
    expect(button).toHaveClass('focus-visible:ring-2')
  })

  it('has transition styles', () => {
    render(<ModernButton>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('transition-all')
    expect(button).toHaveClass('duration-300')
  })

  it('forwards additional props to button element', () => {
    render(
      <ModernButton type="submit" data-testid="submit-btn">
        Submit
      </ModernButton>
    )
    const button = screen.getByTestId('submit-btn')
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('applies hover translate effect when motion is not reduced', () => {
    render(<ModernButton>Button</ModernButton>)
    const button = screen.getByText('Button')
    expect(button).toHaveClass('hover:-translate-y-0.5')
  })

  it('supports all variant and size combinations', () => {
    const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost'> = [
      'primary',
      'secondary',
      'outline',
      'ghost',
    ]
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        const { container } = render(
          <ModernButton variant={variant} size={size}>
            Test
          </ModernButton>
        )
        const button = container.querySelector('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('inline-flex')
      })
    })
  })
})
