import { publishedDateFormatter } from '../utils'

describe('publishedDateFormatter', () => {
  it('keeps date-only values on their authored calendar date', () => {
    expect(publishedDateFormatter.format(new Date('2026-04-09'))).toBe(
      'Apr 9, 2026',
    )
  })
})
