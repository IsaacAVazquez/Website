import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Update value
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // Should still be initial

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    // First update
    rerender({ value: 'update1', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(result.current).toBe('initial')

    // Second update (resets timer)
    rerender({ value: 'update2', delay: 500 })
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(result.current).toBe('initial')

    // Complete the debounce
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(result.current).toBe('update2')
  })

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    )

    rerender({ value: 'updated', delay: 1000 })

    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(result.current).toBe('updated')
  })

  it('should work with different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    )

    numberRerender({ value: 42, delay: 300 })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(numberResult.current).toBe(42)

    // Test with objects
    const initialObj = { name: 'test' }
    const updatedObj = { name: 'updated' }
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 300 },
      }
    )

    objRerender({ value: updatedObj, delay: 300 })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(objResult.current).toBe(updatedObj)
  })

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('test', 500))

    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
