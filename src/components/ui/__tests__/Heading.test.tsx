import React from 'react'
import { render, screen } from '@testing-library/react'
import { Heading } from '../Heading'

describe('Heading', () => {
  it('renders children correctly', () => {
    render(<Heading>Test Heading</Heading>)
    expect(screen.getByText('Test Heading')).toBeInTheDocument()
  })

  it('renders as h1 by default (level 1)', () => {
    render(<Heading>Heading 1</Heading>)
    const heading = screen.getByText('Heading 1')
    expect(heading.tagName).toBe('H1')
  })

  it('renders as h2 when level is 2', () => {
    render(<Heading level={2}>Heading 2</Heading>)
    const heading = screen.getByText('Heading 2')
    expect(heading.tagName).toBe('H2')
  })

  it('renders as h3 when level is 3', () => {
    render(<Heading level={3}>Heading 3</Heading>)
    const heading = screen.getByText('Heading 3')
    expect(heading.tagName).toBe('H3')
  })

  it('renders as h4 when level is 4', () => {
    render(<Heading level={4}>Heading 4</Heading>)
    const heading = screen.getByText('Heading 4')
    expect(heading.tagName).toBe('H4')
  })

  it('renders as h5 when level is 5', () => {
    render(<Heading level={5}>Heading 5</Heading>)
    const heading = screen.getByText('Heading 5')
    expect(heading.tagName).toBe('H5')
  })

  it('renders as h6 when level is 6', () => {
    render(<Heading level={6}>Heading 6</Heading>)
    const heading = screen.getByText('Heading 6')
    expect(heading.tagName).toBe('H6')
  })

  it('uses custom tag when provided via "as" prop', () => {
    render(
      <Heading as="div" level={1}>
        Div Heading
      </Heading>
    )
    const heading = screen.getByText('Div Heading')
    expect(heading.tagName).toBe('DIV')
  })

  it('applies correct text size for level 1', () => {
    render(<Heading level={1}>H1</Heading>)
    const heading = screen.getByText('H1')
    expect(heading).toHaveClass('text-5xl')
    expect(heading).toHaveClass('font-bold')
  })

  it('applies correct text size for level 2', () => {
    render(<Heading level={2}>H2</Heading>)
    const heading = screen.getByText('H2')
    expect(heading).toHaveClass('text-4xl')
    expect(heading).toHaveClass('font-bold')
  })

  it('applies correct text size for level 3', () => {
    render(<Heading level={3}>H3</Heading>)
    const heading = screen.getByText('H3')
    expect(heading).toHaveClass('text-3xl')
    expect(heading).toHaveClass('font-semibold')
  })

  it('applies custom className', () => {
    render(<Heading className="custom-class">Custom</Heading>)
    const heading = screen.getByText('Custom')
    expect(heading).toHaveClass('custom-class')
  })

  it('applies text color from CSS variable', () => {
    render(<Heading>Styled</Heading>)
    const heading = screen.getByText('Styled')
    expect(heading).toHaveClass('text-[var(--home-ink)]')
  })
})
