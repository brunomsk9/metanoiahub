import { describe, it, expect } from 'vitest'

describe('User Roles Logic', () => {
  // Test role-based access control logic
  const userRoles = {
    isAdmin: (roles: string[]) => roles.includes('admin'),
    isDiscipulador: (roles: string[]) => roles.includes('discipulador'),
    isDiscipulo: (roles: string[]) => roles.includes('discipulo'),
    canAccessAdmin: (roles: string[]) => 
      roles.includes('admin') || roles.includes('discipulador'),
    canAccessSOS: (roles: string[]) => 
      roles.includes('admin') || roles.includes('discipulador'),
  }

  it('should correctly identify admin role', () => {
    expect(userRoles.isAdmin(['admin'])).toBe(true)
    expect(userRoles.isAdmin(['discipulo'])).toBe(false)
    expect(userRoles.isAdmin(['admin', 'discipulador'])).toBe(true)
  })

  it('should correctly identify discipulador role', () => {
    expect(userRoles.isDiscipulador(['discipulador'])).toBe(true)
    expect(userRoles.isDiscipulador(['discipulo'])).toBe(false)
    expect(userRoles.isDiscipulador(['admin', 'discipulador'])).toBe(true)
  })

  it('should correctly identify discipulo role', () => {
    expect(userRoles.isDiscipulo(['discipulo'])).toBe(true)
    expect(userRoles.isDiscipulo(['admin'])).toBe(false)
  })

  it('should allow admin and discipulador to access admin panel', () => {
    expect(userRoles.canAccessAdmin(['admin'])).toBe(true)
    expect(userRoles.canAccessAdmin(['discipulador'])).toBe(true)
    expect(userRoles.canAccessAdmin(['discipulo'])).toBe(false)
  })

  it('should allow admin and discipulador to access S.O.S.', () => {
    expect(userRoles.canAccessSOS(['admin'])).toBe(true)
    expect(userRoles.canAccessSOS(['discipulador'])).toBe(true)
    expect(userRoles.canAccessSOS(['discipulo'])).toBe(false)
  })

  it('should handle empty roles array', () => {
    expect(userRoles.isAdmin([])).toBe(false)
    expect(userRoles.isDiscipulador([])).toBe(false)
    expect(userRoles.isDiscipulo([])).toBe(false)
    expect(userRoles.canAccessAdmin([])).toBe(false)
  })

  it('should handle users with multiple roles', () => {
    const multiRoleUser = ['discipulo', 'discipulador', 'admin']
    expect(userRoles.isAdmin(multiRoleUser)).toBe(true)
    expect(userRoles.isDiscipulador(multiRoleUser)).toBe(true)
    expect(userRoles.isDiscipulo(multiRoleUser)).toBe(true)
    expect(userRoles.canAccessAdmin(multiRoleUser)).toBe(true)
  })
})

describe('Role Display Logic', () => {
  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('admin')) return 'Administrador'
    if (roles.includes('discipulador')) return 'Discipulador'
    return 'Discípulo'
  }

  it('should display correct role name', () => {
    expect(getRoleDisplayName(['admin'])).toBe('Administrador')
    expect(getRoleDisplayName(['discipulador'])).toBe('Discipulador')
    expect(getRoleDisplayName(['discipulo'])).toBe('Discípulo')
    expect(getRoleDisplayName([])).toBe('Discípulo')
  })

  it('should prioritize admin role in display', () => {
    expect(getRoleDisplayName(['admin', 'discipulador', 'discipulo'])).toBe('Administrador')
    expect(getRoleDisplayName(['discipulador', 'discipulo'])).toBe('Discipulador')
  })
})
