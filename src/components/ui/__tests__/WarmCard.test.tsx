import React from 'react'
import { render, screen } from '@testing-library/react'
import { WarmCard } from '../WarmCard'

describe('WarmCard', () => {
  it('renders children correctly', () => {
    render(
      <WarmCard>
        <p>Test content</p>
      </WarmCard>
    )
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies default padding (md)', () => {
    const { container } = render(
      <WarmCard>
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('p-6')
  })

  it('applies custom padding when specified', () => {
    const { container } = render(
      <WarmCard padding="lg">
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('p-8')
  })

  it('applies no padding when padding is "none"', () => {
    const { container } = render(
      <WarmCard padding="none">
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).not.toHaveClass('p-4')
    expect(card).not.toHaveClass('p-5')
    expect(card).not.toHaveClass('p-6')
    expect(card).not.toHaveClass('p-8')
    expect(card).not.toHaveClass('p-10')
  })

  it('applies hover effects when hover prop is true', () => {
    const { container } = render(
      <WarmCard hover>
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('portfolio-card-hover')
    expect(card).toHaveClass('cursor-pointer')
  })

  it('does not apply hover effects when hover prop is false', () => {
    const { container } = render(
      <WarmCard hover={false}>
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).not.toHaveClass('cursor-pointer')
  })

  it('applies custom className', () => {
    const { container } = render(
      <WarmCard className="custom-class">
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-class')
  })

  it('has correct ARIA attributes', () => {
    const { container } = render(
      <WarmCard ariaLabel="Test Card" ariaDescription="This is a test card">
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveAttribute('role', 'article')
    expect(card).toHaveAttribute('aria-label', 'Test Card')
    expect(card).toHaveAttribute('title', 'This is a test card')
  })

  it('has base styling classes', () => {
    const { container } = render(
      <WarmCard>
        <p>Test</p>
      </WarmCard>
    )
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('portfolio-card')
  })

  it('supports all padding sizes', () => {
    const sizes: Array<'none' | 'sm' | 'md' | 'lg' | 'xl'> = ['none', 'sm', 'md', 'lg', 'xl']
    const expectedSubstrings = ['', 'p-5', 'p-6', 'p-8', 'p-10']

    sizes.forEach((size, index) => {
      const { container } = render(
        <WarmCard padding={size}>
          <p>Test {size}</p>
        </WarmCard>
      )
      const card = container.firstChild as HTMLElement
      if (expectedSubstrings[index]) {
        expect(card.className).toContain(expectedSubstrings[index])
      }
    })
  })
})
