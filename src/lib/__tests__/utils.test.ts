import { isMobile, publishedDateFormatter } from '../utils'

describe('isMobile utility function', () => {
  beforeEach(() => {
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('returns false for desktop width (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    expect(isMobile()).toBe(false)
  })

  it('returns true for mobile width (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
    expect(isMobile()).toBe(true)
  })

  it('returns false at exactly 768px (boundary)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    expect(isMobile()).toBe(false)
  })

  it('returns true at 767px', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })
    expect(isMobile()).toBe(true)
  })
})

describe('publishedDateFormatter', () => {
  it('keeps date-only values on their authored calendar date', () => {
    expect(publishedDateFormatter.format(new Date('2026-04-09'))).toBe(
      'Apr 9, 2026',
    )
  })
})
