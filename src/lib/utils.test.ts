import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('should handle false conditions', () => {
    const isActive = false
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class')
  })

  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4', 'p-2')
    expect(result).toBe('p-2')
  })

  it('should handle empty strings', () => {
    const result = cn('base-class', '', 'another-class')
    expect(result).toBe('base-class another-class')
  })

  it('should handle undefined values', () => {
    const result = cn('base-class', undefined, 'another-class')
    expect(result).toBe('base-class another-class')
  })

  it('should handle null values', () => {
    const result = cn('base-class', null, 'another-class')
    expect(result).toBe('base-class another-class')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['class-1', 'class-2'])
    expect(result).toBe('class-1 class-2')
  })

  it('should handle object notation', () => {
    const result = cn({ 'active': true, 'disabled': false })
    expect(result).toBe('active')
  })
})
