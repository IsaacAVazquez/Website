import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { StockCard } from '../StockCard'
import { EnhancedHolding } from '@/types/investment'

// Mock Framer Motion to bypass AnimatePresence wait mode
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} {...props}>{children}</div>
    )),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}))

const baseHolding: EnhancedHolding = {
  symbol: 'AAPL',
  shares: 10,
  averageCost: 150,
  currentPrice: 180,
  currentValue: 1800,
  totalCost: 1500,
  gainLoss: 300,
  gainLossPercent: 20,
  dayChange: 50,
  dayChangePercent: 2.85,
  allocationPercent: 45.5,
  hasError: false,
}

describe('StockCard', () => {
  const mockOnRemove = jest.fn()

  beforeEach(() => {
    mockOnRemove.mockClear()
  })

  it('renders symbol and share info', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText(/10 shares/)).toBeInTheDocument()
  })

  it('shows current price when quote is available', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    // $180.00 — rendered in "Current Price" block
    expect(screen.getByText('$180.00')).toBeInTheDocument()
  })

  it('shows gain/loss in green for positive performance', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    const gainEl = screen.getByText('$300.00')
    expect(gainEl).toHaveClass('text-[var(--color-success)]')
  })

  it('shows loss in red for negative performance', () => {
    const losingHolding: EnhancedHolding = {
      ...baseHolding,
      currentPrice: 120,
      currentValue: 1200,
      gainLoss: -300,
      gainLossPercent: -20,
      dayChange: -30,
      dayChangePercent: -2.44,
    }
    render(<StockCard holding={losingHolding} onRemove={mockOnRemove} />)
    const lossEl = screen.getByText('-$300.00')
    expect(lossEl).toHaveClass('text-[var(--color-error)]')
  })

  it('shows "Price unavailable" badge and dashes when hasError=true', () => {
    const errorHolding: EnhancedHolding = { ...baseHolding, hasError: true }
    render(<StockCard holding={errorHolding} onRemove={mockOnRemove} />)
    expect(screen.getByText('Price unavailable')).toBeInTheDocument()
    // Gain/loss section shows dashes
    const dashes = screen.getAllByText('--')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('shows cost basis price instead of current price when hasError=true', () => {
    const errorHolding: EnhancedHolding = { ...baseHolding, hasError: true }
    render(<StockCard holding={errorHolding} onRemove={mockOnRemove} />)
    // Should show averageCost ($150.00) as the "current" price display
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('calls onRemove after confirming deletion', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    // Step 1: Click the trash icon to reveal confirm dialog
    const trashBtn = screen.getByLabelText('Remove AAPL from portfolio')
    fireEvent.click(trashBtn)
    // Step 2: Click the "Remove" confirm button
    const confirmBtn = screen.getByText('Remove')
    fireEvent.click(confirmBtn)
    expect(mockOnRemove).toHaveBeenCalledWith('AAPL')
    expect(mockOnRemove).toHaveBeenCalledTimes(1)
  })

  it('shows today\'s day change percentage', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    expect(screen.getByText(/\+2\.85%/)).toBeInTheDocument()
  })

  it('dims values when loading=true', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} loading />)
    // The price text container gets opacity-50 when loading
    const priceEl = screen.getByText('$180.00')
    expect(priceEl).toHaveClass('opacity-50')
  })

  it('displays total value and total cost', () => {
    render(<StockCard holding={baseHolding} onRemove={mockOnRemove} />)
    expect(screen.getByText('Total Value')).toBeInTheDocument()
    expect(screen.getByText('$1,800.00')).toBeInTheDocument()
    expect(screen.getByText('Total Cost')).toBeInTheDocument()
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })
})
