import { describe, it, expect } from 'vitest'

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('has crypto.subtle available', () => {
    expect(globalThis.crypto?.subtle).toBeDefined()
  })
})
