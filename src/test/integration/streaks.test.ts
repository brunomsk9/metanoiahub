import { describe, it, expect } from 'vitest'

describe('Streak Calculation Logic', () => {
  // Helper to check if two dates are consecutive days
  const areConsecutiveDays = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays === 1
  }

  it('should identify consecutive days', () => {
    const day1 = new Date('2024-01-15')
    const day2 = new Date('2024-01-16')
    const day3 = new Date('2024-01-18')

    expect(areConsecutiveDays(day1, day2)).toBe(true)
    expect(areConsecutiveDays(day1, day3)).toBe(false)
  })

  // Calculate streak from dates array
  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0

    const sortedDates = dates
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const lastActivity = new Date(sortedDates[0])
    lastActivity.setHours(0, 0, 0, 0)

    // Check if last activity was today or yesterday
    if (lastActivity < yesterday) {
      return 0 // Streak broken
    }

    let streak = 1
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i])
      const next = new Date(sortedDates[i + 1])
      current.setHours(0, 0, 0, 0)
      next.setHours(0, 0, 0, 0)

      if (areConsecutiveDays(next, current)) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  it('should calculate streak correctly', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const dates = [
      today.toISOString().split('T')[0],
      yesterday.toISOString().split('T')[0],
      twoDaysAgo.toISOString().split('T')[0],
    ]

    expect(calculateStreak(dates)).toBe(3)
  })

  it('should return 0 for empty dates', () => {
    expect(calculateStreak([])).toBe(0)
  })

  it('should return 0 for broken streak', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 5)
    
    expect(calculateStreak([oldDate.toISOString().split('T')[0]])).toBe(0)
  })
})

describe('Daily Habits', () => {
  const habitTypes = ['bible_reading', 'prayer', 'devotional']

  const isValidHabitType = (type: string) => {
    return habitTypes.includes(type)
  }

  it('should validate habit types', () => {
    expect(isValidHabitType('bible_reading')).toBe(true)
    expect(isValidHabitType('prayer')).toBe(true)
    expect(isValidHabitType('invalid')).toBe(false)
  })

  // Check if habit is completed today
  const isHabitCompletedToday = (habitDate: string) => {
    const today = new Date().toISOString().split('T')[0]
    return habitDate === today
  }

  it('should check if habit is completed today', () => {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    expect(isHabitCompletedToday(today)).toBe(true)
    expect(isHabitCompletedToday(yesterday.toISOString().split('T')[0])).toBe(false)
  })
})
