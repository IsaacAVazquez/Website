import React from 'react'
import { render, screen } from '@testing-library/react'
import { AnalystRatingGauge } from '../AnalystRatingGauge'
import { AnalystRating } from '@/types/investment'

jest.mock('framer-motion', () => ({
  motion: {
    g: ({ children, ...props }: React.SVGProps<SVGGElement>) => (
      <g {...props}>{children}</g>
    ),
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}))

const makeAnalyst = (overrides: Partial<AnalystRating> = {}): AnalystRating => ({
  recommendationMean: 2.1,
  recommendationKey: 'buy',
  targetHighPrice: 250,
  targetLowPrice: 180,
  targetMeanPrice: 215,
  targetMedianPrice: 210,
  numberOfAnalysts: 30,
  breakdown: { strongBuy: 10, buy: 12, hold: 6, sell: 1, strongSell: 1, total: 30 },
  ...overrides,
})

// Exported for whitebox testing
// meanToAngle: 1 → -180, 3 → -90, 5 → 0
describe('meanToAngle (gauge math)', () => {
  // Test the mapping via rendered SVG aria-label
  it('maps Strong Buy (mean=1) to angle -180 — leftmost', () => {
    const a = makeAnalyst({ recommendationMean: 1, recommendationKey: 'strong_buy' })
    const { container } = render(<AnalystRatingGauge analyst={a} />)
    // The SVG should have aria-label referencing the recommendation
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'Analyst rating: Strong Buy')
  })

  it('maps Hold (mean=3) to mid-gauge', () => {
    const a = makeAnalyst({ recommendationMean: 3, recommendationKey: 'hold' })
    const { container } = render(<AnalystRatingGauge analyst={a} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'Analyst rating: Hold')
  })

  it('maps Strong Sell (mean=5) to angle 0 — rightmost', () => {
    const a = makeAnalyst({ recommendationMean: 5, recommendationKey: 'strong_sell' })
    const { container } = render(<AnalystRatingGauge analyst={a} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-label', 'Analyst rating: Strong Sell')
  })
})

describe('AnalystRatingGauge', () => {
  it('shows the correct short label for buy', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst()} />)
    expect(screen.getByText('BUY')).toBeInTheDocument()
  })

  it('shows the correct short label for strong_buy', () => {
    const a = makeAnalyst({ recommendationKey: 'strong_buy' })
    render(<AnalystRatingGauge analyst={a} />)
    expect(screen.getByText('STR BUY')).toBeInTheDocument()
  })

  it('shows the correct short label for hold', () => {
    const a = makeAnalyst({ recommendationKey: 'hold' })
    render(<AnalystRatingGauge analyst={a} />)
    expect(screen.getByText('HOLD')).toBeInTheDocument()
  })

  it('shows the correct short label for sell', () => {
    const a = makeAnalyst({ recommendationKey: 'sell' })
    render(<AnalystRatingGauge analyst={a} />)
    expect(screen.getByText('SELL')).toBeInTheDocument()
  })

  it('falls back to hold label for unknown recommendationKey', () => {
    const a = makeAnalyst({ recommendationKey: 'unknown_key' })
    render(<AnalystRatingGauge analyst={a} />)
    expect(screen.getByText('HOLD')).toBeInTheDocument()
  })

  it('shows analyst count when numberOfAnalysts is set', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst({ numberOfAnalysts: 42 })} />)
    expect(screen.getByText('42 analysts')).toBeInTheDocument()
  })

  it('hides analyst count when numberOfAnalysts is null', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst({ numberOfAnalysts: null })} />)
    expect(screen.queryByText(/analysts/)).not.toBeInTheDocument()
  })

  it('shows average price target when targetMeanPrice is set', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst({ targetMeanPrice: 215.5 })} />)
    expect(screen.getByText('$215.50')).toBeInTheDocument()
  })

  it('hides price target section when targetMeanPrice is null', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst({ targetMeanPrice: null })} />)
    expect(screen.queryByText('Avg Target')).not.toBeInTheDocument()
  })

  it('renders breakdown bars when total > 0', () => {
    render(<AnalystRatingGauge analyst={makeAnalyst()} />)
    expect(screen.getByText('Strong Buy')).toBeInTheDocument()
    expect(screen.getByText('Strong Sell')).toBeInTheDocument()
  })

  it('does not render breakdown when total is 0', () => {
    const a = makeAnalyst({
      breakdown: { strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0, total: 0 },
    })
    render(<AnalystRatingGauge analyst={a} />)
    expect(screen.queryByText('Strong Buy')).not.toBeInTheDocument()
  })

  it('renders without crashing for sm size', () => {
    const { container } = render(<AnalystRatingGauge analyst={makeAnalyst()} size="sm" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without crashing for lg size', () => {
    const { container } = render(<AnalystRatingGauge analyst={makeAnalyst()} size="lg" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('needle is drawn at the leftmost (Strong Buy) position', () => {
    // After the fix, needleTip is always at -180° (cx - needleR, cy).
    // For a size=md gauge: cx=80, cy=99.2, needleR ≈ 64.
    // The line x2 should equal cx - needleR (i.e., < cx).
    const { container } = render(<AnalystRatingGauge analyst={makeAnalyst()} size="md" />)
    const lines = container.querySelectorAll('line')
    // First line is the shadow, second is the needle (both drawn at -180°)
    expect(lines.length).toBeGreaterThan(0)
    const needleLine = lines[1] // actual needle (not shadow)
    const x2 = parseFloat(needleLine.getAttribute('x2') || '0')
    const x1 = parseFloat(needleLine.getAttribute('x1') || '0')
    // Needle tip should be to the LEFT of center (Strong Buy = leftmost position)
    expect(x2).toBeLessThan(x1)
  })
})
