import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddStockForm } from '../AddStockForm'
import { PortfolioHolding } from '@/types/investment'

// Framer Motion mocks — avoid animation overhead in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => true,
}))

describe('AddStockForm', () => {
  const mockOnAdd = jest.fn()

  beforeEach(() => {
    mockOnAdd.mockClear()
  })

  it('renders the Add Investment button by default', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    expect(screen.getByText('Add Investment')).toBeInTheDocument()
  })

  it('opens the form when Add Investment is clicked', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    expect(screen.getByText('Add New Investment')).toBeInTheDocument()
    expect(screen.getByLabelText('Stock Symbol')).toBeInTheDocument()
    expect(screen.getByLabelText('Number of Shares')).toBeInTheDocument()
    expect(screen.getByLabelText('Average Cost per Share')).toBeInTheDocument()
  })

  it('closes the form on Cancel click', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Add New Investment')).not.toBeInTheDocument()
    expect(screen.getByText('Add Investment')).toBeInTheDocument()
  })

  it('shows validation error for invalid ticker format', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    const symbolInput = screen.getByLabelText('Stock Symbol')
    fireEvent.change(symbolInput, { target: { value: '123' } })
    fireEvent.blur(symbolInput)
    expect(
      screen.getByText('Enter a valid ticker (1-5 letters, e.g. AAPL)')
    ).toBeInTheDocument()
  })

  it('shows validation error for duplicate symbol', () => {
    render(<AddStockForm onAdd={mockOnAdd} existingSymbols={['AAPL']} />)
    fireEvent.click(screen.getByText('Add Investment'))
    const symbolInput = screen.getByLabelText('Stock Symbol')
    fireEvent.change(symbolInput, { target: { value: 'AAPL' } })
    fireEvent.blur(symbolInput)
    expect(
      screen.getByText('AAPL is already in your portfolio')
    ).toBeInTheDocument()
  })

  it('disables submit button when shares is 0', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    fireEvent.change(screen.getByLabelText('Stock Symbol'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Number of Shares'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Average Cost per Share'), { target: { value: '150' } })
    const submitBtn = screen.getByText('Add to Portfolio').closest('button')
    expect(submitBtn).toBeDisabled()
  })

  it('disables submit button when average cost is 0', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    fireEvent.change(screen.getByLabelText('Stock Symbol'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Number of Shares'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Average Cost per Share'), { target: { value: '0' } })
    const submitBtn = screen.getByText('Add to Portfolio').closest('button')
    expect(submitBtn).toBeDisabled()
  })

  it('calls onAdd with correctly typed holding on valid submit', async () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    fireEvent.change(screen.getByLabelText('Stock Symbol'), { target: { value: 'msft' } })
    fireEvent.change(screen.getByLabelText('Number of Shares'), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText('Average Cost per Share'), { target: { value: '400.50' } })
    fireEvent.click(screen.getByText('Add to Portfolio'))

    expect(mockOnAdd).toHaveBeenCalledTimes(1)
    const holding: PortfolioHolding = mockOnAdd.mock.calls[0][0]
    expect(holding.symbol).toBe('MSFT') // uppercased
    expect(holding.shares).toBe(5)
    expect(holding.averageCost).toBe(400.5)
    expect(holding.purchaseDate).toBeDefined()
  })

  it('resets and closes form after successful submit', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    fireEvent.change(screen.getByLabelText('Stock Symbol'), { target: { value: 'GOOGL' } })
    fireEvent.change(screen.getByLabelText('Number of Shares'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Average Cost per Share'), { target: { value: '100' } })
    fireEvent.click(screen.getByText('Add to Portfolio'))

    expect(screen.queryByText('Add New Investment')).not.toBeInTheDocument()
    expect(screen.getByText('Add Investment')).toBeInTheDocument()
  })

  it('does not call onAdd on submit with empty symbol', () => {
    render(<AddStockForm onAdd={mockOnAdd} />)
    fireEvent.click(screen.getByText('Add Investment'))
    // leave symbol empty, fill shares and cost
    fireEvent.change(screen.getByLabelText('Number of Shares'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Average Cost per Share'), { target: { value: '100' } })
    const submitBtn = screen.getByText('Add to Portfolio').closest('button')
    expect(submitBtn).toBeDisabled()
    expect(mockOnAdd).not.toHaveBeenCalled()
  })
})
