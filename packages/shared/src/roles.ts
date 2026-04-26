export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR: 'hr',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Permission → allowed roles mapping.
 * 'checkin:read:individual' is intentionally EMPTY — individual scores are never exposed.
 */
export const PERMISSIONS = {
  'checkin:write':           [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
  'checkin:read:own':        [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
  'checkin:read:team':       [ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],   // aggregated only
  'checkin:read:all':        [ROLES.HR, ROLES.ADMIN],                  // aggregated only
  'checkin:read:individual': [] as Role[],                             // NOBODY
  'alerts:read':             [ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
  'analytics:read':          [ROLES.HR, ROLES.ADMIN],
  'billing:manage':          [ROLES.ADMIN],
  'users:manage':            [ROLES.ADMIN],
} as const

export type Permission = keyof typeof PERMISSIONS
