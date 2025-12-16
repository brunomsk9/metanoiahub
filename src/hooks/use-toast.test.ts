import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast } from './use-toast'

describe('useToast Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast',
      })
    })

    expect(result.current.toasts.length).toBe(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].description).toBe('This is a test toast')
  })

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast())
    
    let toastId: string
    act(() => {
      const { id } = result.current.toast({
        title: 'Toast to dismiss',
      })
      toastId = id
    })

    expect(result.current.toasts.length).toBe(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    // The toast should be marked for dismissal
    expect(result.current.toasts[0]?.open).toBe(false)
  })

  it('should add toast with variant', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({
        title: 'Error Toast',
        variant: 'destructive',
      })
    })

    expect(result.current.toasts[0].variant).toBe('destructive')
  })
})

describe('toast function', () => {
  it('should return id and dismiss/update functions', () => {
    const result = toast({
      title: 'Direct Toast',
    })

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('dismiss')
    expect(result).toHaveProperty('update')
    expect(typeof result.dismiss).toBe('function')
    expect(typeof result.update).toBe('function')
  })
})
