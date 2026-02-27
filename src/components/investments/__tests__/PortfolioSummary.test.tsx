import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PortfolioSummary } from '../PortfolioSummary'
import { PortfolioSummary as PortfolioSummaryType } from '@/types/investment'

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}))

const baseSummary: PortfolioSummaryType = {
  totalValue: 10000,
  totalCost: 8000,
  totalGainLoss: 2000,
  totalGainLossPercent: 25,
  dayChange: 150,
  dayChangePercent: 1.52,
}

describe('PortfolioSummary', () => {
  const mockOnRefresh = jest.fn()

  beforeEach(() => {
    mockOnRefresh.mockClear()
  })

  it('displays total portfolio value', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
  })

  it('displays today\'s change in dollars and percent', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    expect(screen.getByText('$150.00')).toBeInTheDocument()
    expect(screen.getByText('+1.52%')).toBeInTheDocument()
  })

  it('displays total cost basis', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    expect(screen.getByText('$8,000.00')).toBeInTheDocument()
  })

  it('displays total gain/loss', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    expect(screen.getByText('$2,000.00')).toBeInTheDocument()
  })

  it('displays return percentage', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    expect(screen.getByText('+25.00%')).toBeInTheDocument()
  })

  it('shows gain in success color when positive', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    const gainEl = screen.getByText('$2,000.00')
    expect(gainEl).toHaveClass('text-[var(--color-success)]')
  })

  it('shows loss in error color when negative', () => {
    const lossSummary: PortfolioSummaryType = {
      ...baseSummary,
      totalGainLoss: -500,
      totalGainLossPercent: -6.25,
    }
    render(<PortfolioSummary summary={lossSummary} loading={false} onRefresh={mockOnRefresh} />)
    const lossEl = screen.getByText('-$500.00')
    expect(lossEl).toHaveClass('text-[var(--color-error)]')
  })

  it('calls onRefresh when Refresh button is clicked', () => {
    render(<PortfolioSummary summary={baseSummary} loading={false} onRefresh={mockOnRefresh} />)
    const refreshBtn = screen.getByLabelText('Refresh portfolio data')
    fireEvent.click(refreshBtn)
    expect(mockOnRefresh).toHaveBeenCalledTimes(1)
  })

  it('disables refresh button while loading', () => {
    render(<PortfolioSummary summary={baseSummary} loading={true} onRefresh={mockOnRefresh} />)
    const refreshBtn = screen.getByLabelText('Refresh portfolio data')
    expect(refreshBtn).toBeDisabled()
  })

  it('dims values while loading', () => {
    render(<PortfolioSummary summary={baseSummary} loading={true} onRefresh={mockOnRefresh} />)
    const valueEl = screen.getByText('$10,000.00')
    expect(valueEl).toHaveClass('opacity-50')
  })

  it('shows negative day change in error color', () => {
    const negativeDaySummary: PortfolioSummaryType = {
      ...baseSummary,
      dayChange: -200,
      dayChangePercent: -1.96,
    }
    render(
      <PortfolioSummary summary={negativeDaySummary} loading={false} onRefresh={mockOnRefresh} />
    )
    const dayChangeEl = screen.getByText('-$200.00')
    expect(dayChangeEl).toHaveClass('text-[var(--color-error)]')
  })
})
