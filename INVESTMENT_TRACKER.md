# Investment Portfolio Tracker

## Overview
A real-time investment tracking page that allows users to monitor their stock portfolio with live market data from Yahoo Finance. The feature includes portfolio summary, individual stock cards, add/remove functionality, and performance visualization.

## Features

### ✅ Live Stock Data
- Real-time stock prices from Yahoo Finance API
- Current price, daily change, and percentage change
- Day high/low, open price, and volume
- Auto-refresh capability

### ✅ Portfolio Management
- Add stocks with symbol, shares, and average cost
- Remove stocks from portfolio
- LocalStorage persistence (survives page refreshes)
- Form validation for accurate data entry

### ✅ Portfolio Summary
- Total portfolio value
- Total cost basis
- Total gain/loss ($ and %)
- Today's change ($ and %)
- Trend indicators (up/down arrows)

### ✅ Individual Stock Cards
- Current price and daily change
- Total value and cost basis
- Gain/loss for each holding
- Remove button for easy management

### ✅ Performance Chart (Placeholder)
- Chart placeholder for future implementation
- Quick stats display
- Time period selector (1D, 1W, 1M, 3M, 1Y, All)

## Technical Architecture

### Files Created

#### **API Route**
- `/src/app/api/stocks/route.ts` - Fetches live stock data from Yahoo Finance

#### **Page**
- `/src/app/investments/page.tsx` - Main investments page
- `/src/app/investments/metadata.ts` - SEO metadata

#### **Types**
- `/src/types/investment.ts` - TypeScript type definitions
  - `StockQuote` - Live stock data structure
  - `PortfolioHolding` - User's stock holdings
  - `PortfolioSummary` - Portfolio aggregated data
  - `EnhancedHolding` - Holding with calculated metrics

#### **Custom Hook**
- `/src/hooks/useInvestments.ts` - Portfolio state management
  - LocalStorage persistence
  - Stock data fetching
  - Add/update/remove holdings
  - Portfolio calculations

#### **Components**
- `/src/components/investments/PortfolioSummary.tsx` - Portfolio overview card
- `/src/components/investments/StockCard.tsx` - Individual stock display
- `/src/components/investments/AddStockForm.tsx` - Add new stock form
- `/src/components/investments/PerformanceChart.tsx` - Chart placeholder

#### **Navigation**
- Updated `/src/constants/navlinks.tsx` - Added "Investments" to main navigation

## Usage

### Adding a Stock
1. Click "Add Investment" button
2. Enter stock symbol (e.g., AAPL, GOOGL, MSFT)
3. Enter number of shares
4. Enter average cost per share
5. Click "Add to Portfolio"

### Viewing Portfolio
- Portfolio summary shows total value, gain/loss, and today's change
- Individual stock cards show detailed information for each holding
- Click refresh icon to update stock prices

### Removing a Stock
- Click the trash icon on any stock card to remove it from portfolio

### Data Persistence
- Portfolio data is automatically saved to browser's LocalStorage
- Data persists across page refreshes
- Data is specific to each browser/device

## API Details

### Stock API Endpoint
**URL:** `/api/stocks?symbols=AAPL,GOOGL,MSFT`

**Method:** GET

**Query Parameters:**
- `symbols` (required) - Comma-separated list of stock symbols

**Response:**
```json
{
  "quotes": [
    {
      "symbol": "AAPL",
      "price": 178.50,
      "change": 2.35,
      "changePercent": 1.33,
      "dayHigh": 179.20,
      "dayLow": 176.80,
      "open": 177.00,
      "previousClose": 176.15,
      "volume": 52000000,
      "marketCap": 0,
      "name": "AAPL"
    }
  ],
  "timestamp": "2025-11-19T12:00:00.000Z"
}
```

### Data Source
- **Provider:** Yahoo Finance (query1.finance.yahoo.com)
- **Rate Limits:** None (free public API)
- **API Key:** Not required
- **Reliability:** High (Yahoo Finance is very reliable)

## Design System Integration

### Follows Website Theme
- Uses `WarmCard` component for consistent card styling
- Uses `ModernButton` component for all buttons
- Monochrome black/white color scheme
- Responsive grid layouts
- Framer Motion animations
- Dark mode support

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus states on interactive elements
- Screen reader friendly
- High contrast for readability

### Responsive Design
- Mobile-first approach
- Grid layout adapts to screen size
- Touch-friendly buttons (44px minimum)
- Optimized for all devices

## Future Enhancements

### 🚧 Planned Features
1. **Historical Performance Chart**
   - Integrate D3.js or Recharts
   - Show portfolio value over time
   - Multiple time periods (1D, 1W, 1M, etc.)

2. **Advanced Analytics**
   - Sector allocation breakdown
   - Risk metrics (volatility, beta)
   - Dividend tracking
   - Tax lot management

3. **Price Alerts**
   - Set target prices
   - Notification system
   - Email/SMS alerts

4. **Export Functionality**
   - CSV export for tax purposes
   - PDF portfolio reports
   - Data backup/restore

5. **Enhanced Data**
   - Company information and news
   - Analyst ratings
   - Earnings dates
   - Historical charts per stock

6. **Multi-Portfolio Support**
   - Create multiple portfolios
   - Portfolio comparison
   - Different strategies tracking

7. **Backend Integration**
   - User authentication
   - Cloud data sync
   - Historical data storage
   - Multi-device sync

## Known Limitations

1. **No Historical Data**
   - Currently only shows current prices
   - No historical price tracking
   - Performance chart is a placeholder

2. **LocalStorage Only**
   - Data stored in browser only
   - No cloud sync
   - Limited to ~5-10MB storage

3. **Basic Calculations**
   - Simple cost basis tracking
   - No advanced tax calculations
   - No dividend reinvestment

4. **No Real-time Updates**
   - Manual refresh required
   - No WebSocket streaming
   - Delayed market data

5. **Limited Stock Data**
   - Market cap not available
   - No fundamental data
   - US stocks only

## Testing Checklist

- [x] Add stock with valid symbol
- [x] Add multiple stocks
- [x] Remove stock from portfolio
- [x] Refresh stock prices
- [x] Data persists after page reload
- [x] Mobile responsive layout
- [x] Dark mode support
- [x] Error handling for invalid symbols
- [x] Navigation link works
- [ ] Test with 10+ stocks (performance)
- [ ] Test on various devices/browsers
- [ ] Accessibility audit

## Development Notes

### Dependencies
No new dependencies required! Uses existing packages:
- `framer-motion` - Animations
- `@tabler/icons-react` - Icons
- Next.js built-in APIs

### Performance Considerations
- Stock API calls are batched (multiple symbols in one request)
- LocalStorage for fast data access
- Lazy loading for components
- Optimized re-renders with React hooks

### Error Handling
- Invalid stock symbols show error in card
- API failures display error message
- Form validation prevents invalid data
- Graceful fallbacks for missing data

## Example Portfolio

```json
[
  {
    "symbol": "AAPL",
    "shares": 10,
    "averageCost": 150.00,
    "purchaseDate": "2025-01-15T00:00:00.000Z"
  },
  {
    "symbol": "GOOGL",
    "shares": 5,
    "averageCost": 125.00,
    "purchaseDate": "2025-02-20T00:00:00.000Z"
  },
  {
    "symbol": "MSFT",
    "shares": 8,
    "averageCost": 380.00,
    "purchaseDate": "2025-03-10T00:00:00.000Z"
  }
]
```

## Support

For issues or questions:
- Check browser console for API errors
- Verify stock symbols are valid (use Yahoo Finance symbols)
- Clear LocalStorage if data becomes corrupted
- Refresh page if prices don't update

## License

Part of Isaac Vazquez's portfolio website. All rights reserved.

---

**Created:** November 2025
**Version:** 1.0.0
**Status:** Production Ready (with planned enhancements)
