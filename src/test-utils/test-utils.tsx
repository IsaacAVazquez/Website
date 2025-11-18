import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const mockPlayer = (overrides = {}) => ({
  player_name: 'Test Player',
  position: 'QB',
  team: 'TST',
  rank_ecr: 10,
  rank_min: 8,
  rank_max: 12,
  rank_ave: 10,
  rank_std: 1.5,
  tier: 2,
  ...overrides,
})

export const mockTierGroup = (overrides = {}) => ({
  tier: 1,
  label: 'Elite',
  players: [mockPlayer()],
  ...overrides,
})

export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      try {
        callback()
        clearInterval(interval)
        resolve(true)
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          clearInterval(interval)
          reject(error)
        }
      }
    }, 50)
  })
}
