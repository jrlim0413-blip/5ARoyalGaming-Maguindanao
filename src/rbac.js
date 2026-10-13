import { saveSupabaseMatrixConfig, saveSupabaseAuditLog } from './supabase.js'
import { resolveMunicipalityFromBranch, ALL_MUNICIPALITIES } from './municipalities.js'

export const PERMISSIONS = [
  {
    key: 'view_overview',
    label: 'Consolidated Overview & KPIs Tab',
    type: 'tab',
    tabName: 'Overview',
    targetView: 'overview',
    group: 'Workspaces',
    description: 'Executive KPI dashboard showing live gross turnover, hit payouts, and remittance due.',
  },
  {
    key: 'view_reports',
    label: 'Draw Gross & Turnover Reports Tab',
    type: 'tab',
    tabName: 'Draw Reports',
    targetView: 'reports',
    group: 'Workspaces',
    description: 'Draw-by-draw financial reports, supervisor audit rankings, and teller performance sheets.',
  },
  {
    key: 'manage_users',
    label: 'Users & RBAC Administration Tab',
    type: 'tab',
    tabName: 'Users & RBAC',
    targetView: 'rbac',
    group: 'Workspaces',
    description: 'Workstation credential administration and Role Permission Matrix management panel.',
  },
  {
    key: 'audit_logs',
    label: 'Activity & Security Audit Log Tab',
    type: 'tab',
    tabName: 'Activity Log',
    targetView: 'activity',
    group: 'Workspaces',
    description: 'Real-time security audit trail tracking logins, credential updates, and permission toggles.',
  },
  {
    key: 'manage_commissions',
    label: 'Agent Commissions & Supervisor Rates Tab',
    type: 'tab',
    tabName: 'Commissions',
    targetView: 'commissions',
    group: 'Workspaces',
    description: 'Configure baseline agent commission rates per supervisor and individual teller overrides.',
  },

  {
    key: 'print_statements',
    label: 'Print Remittance Statements',
    type: 'feature',
    featureName: 'Print Statements',
    group: 'Operations',
    parentTabs: ['view_overview', 'view_reports'],
    parentTabLabels: ['Overview Tab', 'Draw Reports Tab'],
    description: 'Generates official remittance statements and supervisor payout slips.',
  },
  {
    key: 'export_data',
    label: 'Export Financial Data (CSV)',
    type: 'feature',
    featureName: 'Export Data',
    group: 'Operations',
    parentTabs: ['view_overview', 'view_reports'],
    parentTabLabels: ['Overview Tab', 'Draw Reports Tab'],
    description: 'Downloads consolidated draw matrices and supervisor balance sheets to CSV format.',
  },
  {
    key: 'view_raw_feed',
    label: 'Technical API Raw Inspector',
    type: 'feature',
    featureName: 'Raw API Inspector',
    group: 'Technical',
    parentTabs: ['view_overview'],
    parentTabLabels: ['Overview Tab'],
    description: 'Inspects live incoming API payloads and raw database rows inside the Overview dashboard.',
  },
  {
    key: 'create_credentials',
    label: 'Add & Provision User Credentials',
    type: 'feature',
    featureName: 'Add Users',
    group: 'Administration',
    parentTabs: ['manage_users'],
    parentTabLabels: ['Users & RBAC Tab'],
    description: 'Allows provisioning new system users, passwords, branches, and assigning role privileges.',
  },
  {
    key: 'edit_commissions',
    label: 'Modify & Override Commission Rates',
    type: 'feature',
    featureName: 'Edit Rates & Overrides',
    group: 'Operations',
    parentTabs: ['manage_commissions'],
    parentTabLabels: ['Commissions Tab'],
    description: 'Allows updating supervisor baseline rates and provisioning custom overrides for specific agents.',
  },
  {
    key: 'switch_municipality',
    label: 'Filter & Switch Municipalities',
    type: 'feature',
    featureName: 'Municipality Filter',
    group: 'Operations',
    parentTabs: ['view_overview', 'view_reports'],
    parentTabLabels: ['Overview Tab', 'Draw Reports Tab'],
    description: 'Allows viewing and filtering other municipalities. When disabled or when assigned to a specific municipality, accounts are strictly locked to their assigned municipality with no dropdown.',
  },
]

export const DEFAULT_ROLES = {
  admin: {
    key: 'admin',
    label: 'System Administrator',
    badge: 'Super Admin',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.35)',
    description: 'Unrestricted full access across accounting, reports, user configuration, and audit security.',
    permissions: [
      'view_overview',
      'view_reports',
      'manage_users',
      'audit_logs',
      'manage_commissions',
      'print_statements',
      'export_data',
      'view_raw_feed',
      'create_credentials',
      'edit_commissions',
      'switch_municipality',
    ],
  },
  accountant: {
    key: 'accountant',
    label: 'Head Cashier',
    badge: 'Cashier Lead',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    description: 'Audits daily 3-draw rotation matrices, reviews supervisor balance sheets, and prints statements.',
    permissions: [
      'view_overview',
      'view_reports',
      'manage_commissions',
      'print_statements',
      'export_data',
      'view_raw_feed',
      'edit_commissions',
    ],
  },
  supervisor: {
    key: 'supervisor',
    label: 'Branch Supervisor',
    badge: 'Area Lead',
    color: '#facc15',
    bgColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.35)',
    description: 'Monitors assigned terminal agents, checks remittance ledger, and tracks draw turnover.',
    permissions: ['view_overview', 'view_reports', 'manage_commissions'],
  },
  staff: {
    key: 'staff',
    label: 'Terminal Staff',
    badge: 'Read Only',
    color: '#34d399',
    bgColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    description: 'Operational terminal assistant with access restricted to live overview metrics.',
    permissions: ['view_overview'],
  },
}

export const DEFAULT_USERS = [
  {
    id: 'usr_admin',
    username: 'admin',
    password: 'adminpassword',
    name: 'Jay Ryan Lim',
    role: 'admin',
    roleLabel: 'System Administrator',
    branch: 'Maguindanao HQ',
    assignedMunicipality: 'All Municipalities',
    status: 'active',
    lastLogin: 'Active Now',
    createdAt: '2026-01-15',
    avatar: 'JL',
    email: 'admin@5aroyalgamingopc.ph',
  },
  {
    id: 'usr_accountant',
    username: 'ldn.staff',
    password: 'luckybet2026',
    name: 'Elena Morales',
    role: 'accountant',
    roleLabel: 'Head Cashier',
    branch: 'Parang Branch',
    assignedMunicipality: 'Parang',
    status: 'active',
    lastLogin: 'Today, 09:15 AM',
    createdAt: '2026-02-01',
    avatar: 'EM',
    email: 'elena.m@5aroyalgamingopc.ph',
  },
  {
    id: 'usr_supervisor',
    username: 'supervisor.carlos',
    password: 'luckybet2026',
    name: 'Carlos Tan',
    role: 'supervisor',
    roleLabel: 'Branch Supervisor',
    branch: 'Upi Station',
    assignedMunicipality: 'Upi',
    status: 'active',
    lastLogin: 'Yesterday, 04:30 PM',
    createdAt: '2026-02-10',
    avatar: 'CT',
    email: 'carlos.tan@5aroyalgamingopc.ph',
  },
  {
    id: 'usr_terminal',
    username: 'teller.ldn',
    password: 'luckybet2026',
    name: 'Rico Dela Cruz',
    role: 'staff',
    roleLabel: 'Terminal Staff',
    branch: 'Ampatuan Terminal',
    assignedMunicipality: 'Ampatuan',
    status: 'active',
    lastLogin: '3 days ago',
    createdAt: '2026-02-20',
    avatar: 'RD',
    email: 'rico.staff@5aroyalgamingopc.ph',
  },
]

export const DEFAULT_AUDIT_LOGS = [
  {
    id: 'log_01',
    timestamp: 'Today, 09:30 AM',
    action: 'SESSION_AUTHENTICATION',
    actor: 'admin',
    details: 'System Administrator authenticated from 256-bit SSL Gateway',
    severity: 'info',
  },
  {
    id: 'log_02',
    timestamp: 'Today, 08:45 AM',
    action: 'RBAC_CREDENTIAL_VERIFIED',
    actor: 'ldn.staff',
    details: 'Accounting credentials verified for LDN draw turnover',
    severity: 'success',
  },
  {
    id: 'log_03',
    timestamp: 'Yesterday, 09:00 PM',
    action: 'DRAW_RECONCILIATION',
    actor: 'system',
    details: 'Evening 7:00 PM & 9:00 PM draw matrix balanced at 99.98% accuracy',
    severity: 'info',
  },
]

let inMemoryRoles = { ...DEFAULT_ROLES }
let inMemoryUserPerms = {}
let inMemoryUsers = null
let inMemoryDeleted = []
let inMemoryAuditLogs = [...DEFAULT_AUDIT_LOGS]

export function setInternalRbacRoles(roles) {
  if (!roles || typeof roles !== 'object') return false
  const oldStr = JSON.stringify(inMemoryRoles)
  const newStr = JSON.stringify(roles)
  if (oldStr !== newStr) {
    inMemoryRoles = { ...roles }
    return true
  }
  return false
}

export function setInternalUserCustomPerms(perms) {
  if (!perms || typeof perms !== 'object') return false
  const oldStr = JSON.stringify(inMemoryUserPerms)
  const newStr = JSON.stringify(perms)
  if (oldStr !== newStr) {
    inMemoryUserPerms = { ...perms }
    return true
  }
  return false
}

export function setInternalRbacUsers(users) {
  if (Array.isArray(users)) {
    inMemoryUsers = [...users]
  }
}

export function setInternalAuditLogs(logs) {
  if (Array.isArray(logs)) {
    inMemoryAuditLogs = [...logs]
  }
}

export function getRbacRoles() {
  if (inMemoryRoles.admin && Array.isArray(inMemoryRoles.admin.permissions) && !inMemoryRoles.admin.permissions.includes('switch_municipality')) {
    inMemoryRoles.admin.permissions.push('switch_municipality')
  }
  return inMemoryRoles
}

export function saveRbacRoles(roles) {
  inMemoryRoles = { ...roles }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('luckybet_rbac_change', { detail: { roles } }))
  }

  saveSupabaseMatrixConfig({
    roles,
    userPerms: getUserCustomPermissionsMap(),
  }).catch((err) => {
    console.warn('Supabase cloud roles sync failed:', err)
  })
}

export function getUserCustomPermissionsMap() {
  return inMemoryUserPerms
}

export function saveUserCustomPermissionsMap(map) {
  inMemoryUserPerms = { ...map }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('luckybet_rbac_change', { detail: { userPerms: map } }))
  }

  saveSupabaseMatrixConfig({
    roles: getRbacRoles(),
    userPerms: map,
  }).catch((err) => {
    console.warn('Supabase cloud user perms sync failed:', err)
  })
}

export function getUserCustomPermissions(username) {
  if (!username) return null
  const clean = username.trim().toLowerCase()
  return Array.isArray(inMemoryUserPerms[clean]) ? inMemoryUserPerms[clean] : null
}

export function setUserCustomPermissions(username, permissions) {
  if (!username) return
  const clean = username.trim().toLowerCase()
  if (permissions === null || permissions === undefined) {
    delete inMemoryUserPerms[clean]
  } else {
    inMemoryUserPerms[clean] = permissions
  }
  saveUserCustomPermissionsMap(inMemoryUserPerms)
}

export function clearUserCustomPermissions(username) {
  setUserCustomPermissions(username, null)
}

export function getDeletedUsernames() {
  return inMemoryDeleted
}

export function recordDeletedUsername(username) {
  if (!username) return
  const clean = username.trim().toLowerCase()
  if (!inMemoryDeleted.includes(clean)) {
    inMemoryDeleted.push(clean)
  }
}

export function unmarkDeletedUsername(username) {
  if (!username) return
  const clean = username.trim().toLowerCase()
  inMemoryDeleted = inMemoryDeleted.filter((u) => u !== clean)
}

export function sanitizeBranchString(str) {
  if (typeof str !== 'string') return str
  return str.replace(/Mandaue/gi, 'LDN')
}

export function getRbacUsers() {
  if (!inMemoryUsers) {
    inMemoryUsers = DEFAULT_USERS.map((u) => {
      let resolvedMuni = u.assignedMunicipality
      if (!resolvedMuni || resolvedMuni === ALL_MUNICIPALITIES) {
        const fromBranch = resolveMunicipalityFromBranch(u.branch)
        if (fromBranch && fromBranch !== ALL_MUNICIPALITIES) {
          resolvedMuni = fromBranch
        }
      }
      return {
        ...u,
        assignedMunicipality: resolvedMuni || ALL_MUNICIPALITIES,
      }
    })
  }
  return inMemoryUsers.filter((u) => !inMemoryDeleted.includes(u.username.toLowerCase()))
}

export function saveRbacUsers(users) {
  if (Array.isArray(users)) {
    inMemoryUsers = [...users]
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('luckybet_rbac_change', { detail: { users } }))
    }
  }
}

export function getAuditLogs() {
  return inMemoryAuditLogs
}

export function addAuditLog(action, details, actor = 'current_user', severity = 'info') {
  const now = new Date()
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  const newEntry = {
    id: `log_${Date.now()}`,
    timestamp: timeStr,
    action,
    actor,
    details,
    severity,
  }
  inMemoryAuditLogs = [newEntry, ...inMemoryAuditLogs].slice(0, 50)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('luckybet_rbac_change', { detail: { log: newEntry } }))
  }
  try {
    saveSupabaseAuditLog(newEntry).catch(() => {})
  } catch {}
  return inMemoryAuditLogs
}

export function verifyUserCredentials(username, password) {
  const users = getRbacUsers()
  const cleanUser = String(username || '').trim().toLowerCase()
  const cleanPass = String(password || '').trim()

  const deleted = getDeletedUsernames()
  if (deleted.includes(cleanUser)) {
    return null
  }

  const userRecord = users.find((u) => u.username.toLowerCase() === cleanUser)
  if (userRecord && (userRecord.status === 'suspended' || userRecord.status === 'inactive')) {
    if (userRecord.password === cleanPass) {
      return { deactivated: true, username: userRecord.username }
    }
  }

  const match = users.find(
    (u) =>
      u.status === 'active' &&
      u.username.toLowerCase() === cleanUser &&
      u.password === cleanPass
  )

  if (match) {
    const roles = getRbacRoles()
    const roleDef = roles[match.role] || DEFAULT_ROLES[match.role] || DEFAULT_ROLES.staff
    const defUser = DEFAULT_USERS.find((d) => d.username.toLowerCase() === match.username.toLowerCase())
    let resolvedMuni = match.assignedMunicipality
    if (!resolvedMuni || resolvedMuni === ALL_MUNICIPALITIES) {
      if (defUser && defUser.assignedMunicipality && defUser.assignedMunicipality !== ALL_MUNICIPALITIES) {
        resolvedMuni = defUser.assignedMunicipality
      } else {
        const fromBranch = resolveMunicipalityFromBranch(match.branch)
        if (fromBranch && fromBranch !== ALL_MUNICIPALITIES) {
          resolvedMuni = fromBranch
        }
      }
    }
    if (!resolvedMuni) {
      resolvedMuni = ALL_MUNICIPALITIES
    }

    return {
      id: match.id,
      username: match.username,
      name: match.name,
      role: match.role,
      roleLabel: roleDef.label,
      roleBadge: roleDef.badge,
      permissions: getUserEffectivePermissions(match, roles),
      branch: match.branch,
      assignedMunicipality: resolvedMuni,
      avatar: match.avatar || match.name.substring(0, 2).toUpperCase(),
      email: match.email,
      loginTime: new Date().toISOString(),
      token: 'rbac-token-' + match.id,
    }
  }

  return null
}

export function getUserEffectivePermissions(user, roles = null) {
  if (!user) return []
  const username = String(user.username || '').trim().toLowerCase()
  const custom = getUserCustomPermissions(username)
  if (Array.isArray(custom)) {
    return custom
  }
  if (Array.isArray(user.customPermissions)) {
    return user.customPermissions
  }
  const activeRoles = roles || getRbacRoles()
  const roleDef = activeRoles[user.role] || DEFAULT_ROLES[user.role] || DEFAULT_ROLES.staff
  return roleDef?.permissions || []
}

export function isTabPermission(key) {
  const p = PERMISSIONS.find((item) => item.key === key)
  return p?.type === 'tab'
}

export function isFeaturePermission(key) {
  const p = PERMISSIONS.find((item) => item.key === key)
  return p?.type === 'feature'
}

export function getPermissionMeta(key) {
  return (
    PERMISSIONS.find((item) => item.key === key) || {
      key,
      label: key,
      type: 'feature',
      group: 'General',
      parentTabs: [],
      parentTabLabels: [],
      description: '',
    }
  )
}

export function areFeatureParentTabsDisabled(permKey, activePermissions = []) {
  const meta = getPermissionMeta(permKey)
  if (meta.type !== 'feature') return false
  const parentTabs = meta.parentTabs || []
  if (parentTabs.length === 0) return false
  const hasActiveParent = parentTabs.some((tabKey) => activePermissions.includes(tabKey))
  return !hasActiveParent
}

export function getAffectedFeaturesWhenTabDisabled(tabKey, currentPerms = []) {
  const remainingWithoutTab = currentPerms.filter((k) => k !== tabKey)
  return PERMISSIONS.filter((p) => {
    if (p.type !== 'feature' || !p.parentTabs?.includes(tabKey)) return false
    if (!currentPerms.includes(p.key)) return false
    const hasRemainingParent = p.parentTabs.some((pt) => remainingWithoutTab.includes(pt))
    return !hasRemainingParent
  })
}

export function hasPermission(currentUser, permKey, roles = null) {
  if (!currentUser) return false
  const perms = getUserEffectivePermissions(currentUser, roles)
  if (!perms.includes(permKey)) return false

  const meta = getPermissionMeta(permKey)
  if (meta.type === 'feature' && meta.parentTabs?.length > 0) {
    const hasParentTab = meta.parentTabs.some((tabKey) => perms.includes(tabKey))
    if (!hasParentTab) return false
  }

  return true
}

