import { describe, it, expect } from 'vitest'

describe('Reading Plans Logic', () => {
  // Test reading plan progress calculation
  const calculateProgress = (completedDays: number[], totalDays: number) => {
    if (totalDays === 0) return 0
    return Math.round((completedDays.length / totalDays) * 100)
  }

  it('should calculate progress correctly', () => {
    expect(calculateProgress([1, 2, 3], 7)).toBe(43)
    expect(calculateProgress([1, 2, 3, 4, 5, 6, 7], 7)).toBe(100)
    expect(calculateProgress([], 7)).toBe(0)
    expect(calculateProgress([1], 30)).toBe(3)
  })

  it('should handle edge cases', () => {
    expect(calculateProgress([], 0)).toBe(0)
    expect(calculateProgress([1, 2, 3], 3)).toBe(100)
  })

  // Test if day is completed
  const isDayCompleted = (day: number, completedDays: number[]) => {
    return completedDays.includes(day)
  }

  it('should correctly check if day is completed', () => {
    const completedDays = [1, 3, 5, 7]
    expect(isDayCompleted(1, completedDays)).toBe(true)
    expect(isDayCompleted(2, completedDays)).toBe(false)
    expect(isDayCompleted(5, completedDays)).toBe(true)
    expect(isDayCompleted(10, completedDays)).toBe(false)
  })

  // Test get next day to complete
  const getNextDay = (completedDays: number[], totalDays: number) => {
    for (let i = 1; i <= totalDays; i++) {
      if (!completedDays.includes(i)) return i
    }
    return null // All days completed
  }

  it('should get the next incomplete day', () => {
    expect(getNextDay([1, 2], 7)).toBe(3)
    expect(getNextDay([], 7)).toBe(1)
    expect(getNextDay([1, 2, 3, 4, 5, 6, 7], 7)).toBe(null)
    expect(getNextDay([1, 3, 5], 7)).toBe(2) // First gap
  })

  // Test plan completion status
  const isPlanCompleted = (completedDays: number[], totalDays: number) => {
    return completedDays.length >= totalDays
  }

  it('should correctly identify completed plans', () => {
    expect(isPlanCompleted([1, 2, 3, 4, 5, 6, 7], 7)).toBe(true)
    expect(isPlanCompleted([1, 2, 3], 7)).toBe(false)
    expect(isPlanCompleted([], 7)).toBe(false)
  })
})

describe('Reading Plan Categories', () => {
  const categories = ['devocional', 'estudo', 'vida_cristã']
  
  const isValidCategory = (category: string) => {
    return categories.includes(category)
  }

  it('should validate plan categories', () => {
    expect(isValidCategory('devocional')).toBe(true)
    expect(isValidCategory('estudo')).toBe(true)
    expect(isValidCategory('invalid')).toBe(false)
  })
})

describe('Reading Plan Duration', () => {
  const getPlanDurationType = (days: number) => {
    if (days <= 7) return 'semanal'
    if (days <= 30) return 'mensal'
    if (days <= 180) return 'semestral'
    return 'anual'
  }

  it('should correctly categorize plan duration', () => {
    expect(getPlanDurationType(7)).toBe('semanal')
    expect(getPlanDurationType(21)).toBe('mensal')
    expect(getPlanDurationType(30)).toBe('mensal')
    expect(getPlanDurationType(90)).toBe('semestral')
    expect(getPlanDurationType(180)).toBe('semestral')
    expect(getPlanDurationType(365)).toBe('anual')
  })
})
