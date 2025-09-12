import { describe, it, expect } from 'vitest'
import { getThreadName, hasMultipleWorkers } from '../../src/utilities/threads.ts'

describe('getThreadName', () => {
  it('should return "All Threads" when idx is "all"', () => {
    expect(getThreadName('all')).toBe('All Threads')
  })

  it('should return formatted thread name for numeric index', () => {
    expect(getThreadName(0)).toBe('Thread-0')
    expect(getThreadName(1)).toBe('Thread-1')
    expect(getThreadName(42)).toBe('Thread-42')
  })

  it('should handle negative numbers', () => {
    expect(getThreadName(-1)).toBe('Thread--1')
  })
})

describe('hasMultipleWorkers', () => {
  it('should return true when workers > 1', () => {
    expect(hasMultipleWorkers(2)).toBe(true)
    expect(hasMultipleWorkers(5)).toBe(true)
    expect(hasMultipleWorkers(100)).toBe(true)
  })

  it('should return false when workers <= 1', () => {
    expect(hasMultipleWorkers(1)).toBe(false)
    expect(hasMultipleWorkers(0)).toBe(false)
  })

  it('should return false when workers is undefined', () => {
    expect(hasMultipleWorkers(undefined)).toBe(false)
  })

  it('should return false for falsy values', () => {
    expect(hasMultipleWorkers(null as unknown as undefined)).toBe(false)
  })
})
