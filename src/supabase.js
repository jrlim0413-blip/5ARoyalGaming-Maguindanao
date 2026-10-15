import { createClient } from '@supabase/supabase-js'
import { resolveMunicipalityFromBranch, ALL_MUNICIPALITIES } from './municipalities.js'
import { setInternalRbacRoles, setInternalUserCustomPerms, setInternalRbacUsers, setInternalAuditLogs, getRbacUsers, getAuditLogs } from './rbac.js'
import { setInternalCommissionSettings } from './commissions.js'

export const setInMemoryRoles = setInternalRbacRoles
export const setInMemoryUserPerms = setInternalUserCustomPerms
export const setInMemoryUsers = setInternalRbacUsers
export const setInMemoryAuditLogs = setInternalAuditLogs
export const setInMemoryCommissionSettings = setInternalCommissionSettings

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

const supabaseUrl =
  env.VITE_SUPABASE_URL || 'https://zcautuharvzntfbmling.supabase.co'
const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjYXV0dWhhcnZ6bnRmYm1saW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDA5OTQsImV4cCI6MjEwNzIxNjk5NH0.AjZkT3Voujg-84-JjLRNzd8QjqbE8pSL8CwoJmg0iJ0'

export const isSupabaseConfigured = true

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const RBAC_TABLE_NAME = 'rbac_users'

export function formatSupabaseEmail(identifier) {
  const clean = String(identifier || '').trim().toLowerCase()
  if (clean.includes('@')) return clean
  return `${clean}@luckybetplay.ph`
}

export async function verifyCredentialsInSupabaseTable(username, password) {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not configured' }
  }

  const cleanUser = String(username || '').trim().toLowerCase()
  const cleanPass = String(password || '').trim()

  if (cleanUser.startsWith('__')) {
    return {
      success: false,
      notFound: true,
      error: 'Invalid username credentials.',
    }
  }

  try {
    const { data, error } = await supabase
      .from(RBAC_TABLE_NAME)
      .select('*')
      .ilike('username', cleanUser)
      .limit(1)

    if (error) {
      const isMissingTable =
        error.code === 'PGRST205' ||
        error.code === '42P01' ||
        (error.message && error.message.includes('not find the table'))
      return {
        success: false,
        tableMissing: isMissingTable,
        error: error.message,
      }
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        notFound: true,
        error: `Account "${username}" is not registered in the authorized credentials directory.`,
      }
    }

    const account = data[0]

    if (account.status === 'suspended' || account.status === 'inactive' || account.status === 'system') {
      return {
        success: false,
        inactive: true,
        error: `Access Denied: The account "${account.username}" is currently deactivated. Please contact your system administrator.`,
      }
    }

    if (account.password !== cleanPass) {
      return {
        success: false,
        wrongPassword: true,
        error: 'Invalid password. Please verify your credentials and try again.',
      }
    }

    supabase
      .from(RBAC_TABLE_NAME)
      .update({ last_login: new Date().toISOString() })
      .eq('id', account.id)
      .then(() => { })
      .catch(() => { })

    let resolvedMuni = account.assigned_municipality || account.assignedMunicipality
    if (!resolvedMuni || resolvedMuni === ALL_MUNICIPALITIES) {
      const fromBranch = resolveMunicipalityFromBranch(account.branch)
      if (fromBranch && fromBranch !== ALL_MUNICIPALITIES) {
        resolvedMuni = fromBranch
      }
    }
    if (!resolvedMuni) {
      resolvedMuni = ALL_MUNICIPALITIES
    }

    return {
      success: true,
      account: {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
        roleLabel: account.role_label || account.roleLabel,
        branch: account.branch,
        assignedMunicipality: resolvedMuni,
        status: account.status,
        avatar: account.avatar || account.name.substring(0, 2).toUpperCase(),
        email: account.email,
        createdAt: account.created_at,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Error connecting to dedicated database table.',
    }
  }
}

export const MATRIX_CONFIG_ID = 'matrix_config'
export const MATRIX_CONFIG_SYS_ID = '__sys_matrix_config__'
export const MATRIX_REALTIME_CHANNEL = 'rbac-matrix-realtime'

let realtimeChannelInstance = null

export async function getSupabaseMatrixConfig() {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'get_matrix')
      const res = await fetch(u)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.config) return { success: true, config: json.config }
      }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const { data: tableData, error: tableErr } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', MATRIX_CONFIG_ID)
      .maybeSingle()

    if (!tableErr && tableData?.config) {
      return { success: true, config: tableData.config, source: 'rbac_matrix_config' }
    }

    const { data: userData, error: userErr } = await supabase
      .from(RBAC_TABLE_NAME)
      .select('email')
      .eq('id', MATRIX_CONFIG_SYS_ID)
      .maybeSingle()

    if (!userErr && userData?.email) {
      try {
        const parsed = JSON.parse(userData.email)
        return { success: true, config: parsed, source: 'rbac_users_fallback' }
      } catch (parseErr) {
        console.warn('Failed to parse matrix config from fallback email payload:', parseErr)
      }
    }

    return { success: false, error: userErr?.message || tableErr?.message || 'No cloud matrix found' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function saveSupabaseMatrixConfig(config) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'save_matrix')
      const pRes = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (pRes.ok) {
        if (realtimeChannelInstance) {
          realtimeChannelInstance.send({
            type: 'broadcast',
            event: 'matrix_updated',
            payload: { timestamp: Date.now() },
          }).catch(() => {})
        }
        return { success: true, source: 'proxy' }
      }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const payloadWithTimestamp = {
      ...config,
      updatedAt: new Date().toISOString(),
    }

    let savedToTable = false

    try {
      const { error: tableErr } = await supabase
        .from('rbac_matrix_config')
        .upsert({
          id: MATRIX_CONFIG_ID,
          config: payloadWithTimestamp,
          updated_at: new Date().toISOString(),
        })
      if (!tableErr) {
        savedToTable = true
      }
    } catch { }

    let userErr = null
    if (!savedToTable) {
      const sysRow = {
        id: MATRIX_CONFIG_SYS_ID,
        username: MATRIX_CONFIG_SYS_ID,
        password: 'sys_protected_config_row',
        name: 'RBAC Permission Matrix System Config',
        role: 'system',
        role_label: 'System Config',
        branch: 'System',
        status: 'system',
        avatar: 'CF',
        email: JSON.stringify(payloadWithTimestamp),
      }

      const res = await supabase
        .from(RBAC_TABLE_NAME)
        .upsert(sysRow, { onConflict: 'username' })
      userErr = res.error
    }

    try {
      if (realtimeChannelInstance) {
        realtimeChannelInstance.send({
          type: 'broadcast',
          event: 'matrix_updated',
          payload: { timestamp: Date.now() },
        })
      }
    } catch { }

    if (savedToTable || !userErr) {
      return { success: true, source: savedToTable ? 'rbac_matrix_config' : 'rbac_users_fallback' }
    }

    return { success: false, error: userErr?.message }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function syncMatrixPermissionsFromSupabase() {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' }
  try {
    const res = await getSupabaseMatrixConfig()
    if (res.success && res.config) {
      const { roles, userPerms } = res.config
      let changed = false

      if (roles && typeof roles === 'object') {
        changed = setInternalRbacRoles(roles) || changed
      }

      if (userPerms && typeof userPerms === 'object') {
        changed = setInternalUserCustomPerms(userPerms) || changed
      }

      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('luckybet_rbac_change', {
            detail: { roles, userPerms, source: 'supabase_sync' },
          })
        )
      }

      return { success: true, config: res.config, changed }
    }
    return { success: false, error: res.error }
  } catch (err) {
    console.warn('Syncing matrix permissions from Supabase failed:', err)
    return { success: false, error: err.message }
  }
}

export const COMMISSIONS_CONFIG_ID = 'commissions_config'
export const COMMISSIONS_CONFIG_SYS_ID = '__sys_commissions_config__'

export async function getSupabaseCommissionSettings() {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'get_commissions')
      const res = await fetch(u)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.settings) return { success: true, settings: json.settings }
      }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const { data: tableData, error: tableErr } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', COMMISSIONS_CONFIG_ID)
      .maybeSingle()

    if (!tableErr && tableData?.config) {
      return { success: true, settings: tableData.config, source: 'rbac_matrix_config' }
    }

    const { data: userData, error: userErr } = await supabase
      .from(RBAC_TABLE_NAME)
      .select('email')
      .eq('id', COMMISSIONS_CONFIG_SYS_ID)
      .maybeSingle()

    if (!userErr && userData?.email) {
      try {
        const parsed = JSON.parse(userData.email)
        return { success: true, settings: parsed, source: 'rbac_users_fallback' }
      } catch (parseErr) {
        console.warn('Failed to parse commission settings from fallback payload:', parseErr)
      }
    }

    return { success: false, error: userErr?.message || tableErr?.message || 'No cloud commission settings found' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function saveSupabaseCommissionSettings(settings) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'save_commissions')
      const pRes = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (pRes.ok) {
        if (realtimeChannelInstance) {
          realtimeChannelInstance.send({
            type: 'broadcast',
            event: 'commissions_updated',
            payload: { timestamp: Date.now() },
          }).catch(() => {})
        }
        return { success: true, source: 'proxy' }
      }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const payload = {
      globalDefaultRate: Number(settings.globalDefaultRate) || 10.0,
      supervisors: settings.supervisors || {},
      updatedAt: new Date().toISOString(),
    }

    let savedToTable = false

    try {
      const { error: tableErr } = await supabase
        .from('rbac_matrix_config')
        .upsert({
          id: COMMISSIONS_CONFIG_ID,
          config: payload,
          updated_at: new Date().toISOString(),
        })
      if (!tableErr) savedToTable = true
    } catch { }

    let userErr = null
    if (!savedToTable) {
      const sysRow = {
        id: COMMISSIONS_CONFIG_SYS_ID,
        username: COMMISSIONS_CONFIG_SYS_ID,
        password: 'sys_protected_config_row',
        name: 'Agent Commission Settings System Config',
        role: 'system',
        role_label: 'System Config',
        branch: 'System',
        status: 'system',
        avatar: 'CM',
        email: JSON.stringify(payload),
      }

      const res = await supabase
        .from(RBAC_TABLE_NAME)
        .upsert(sysRow, { onConflict: 'username' })
      userErr = res.error
    }

    try {
      if (realtimeChannelInstance) {
        realtimeChannelInstance.send({
          type: 'broadcast',
          event: 'commissions_updated',
          payload: { timestamp: Date.now() },
        })
      }
    } catch { }

    if (savedToTable || !userErr) {
      return { success: true, source: savedToTable ? 'rbac_matrix_config' : 'rbac_users_fallback' }
    }

    return { success: false, error: userErr?.message }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function syncCommissionSettingsFromSupabase() {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' }
  try {
    const res = await getSupabaseCommissionSettings()
    if (res.success && res.settings) {
      const changed = setInternalCommissionSettings(res.settings)

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('luckybet_commissions_updated', {
            detail: res.settings,
            source: 'supabase_sync',
          })
        )
      }

      return { success: true, settings: res.settings, changed }
    }
    return { success: false, error: res.error }
  } catch (err) {
    console.warn('Syncing commission settings from Supabase failed:', err)
    return { success: false, error: err.message }
  }
}

export function subscribeToMatrixRealtime(onUpdate) {
  if (!supabase) return () => { }

  let matrixChannel = supabase
    .channel(MATRIX_REALTIME_CHANNEL)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rbac_matrix_config',
      },
      () => {
        if (typeof onUpdate === 'function') {
          onUpdate({ type: 'table_change' })
        }
      }
    )
    .on(
      'broadcast',
      { event: 'matrix_updated' },
      () => {
        if (typeof onUpdate === 'function') {
          onUpdate({ type: 'broadcast_matrix' })
        }
      }
    )
    .on(
      'broadcast',
      { event: 'commissions_updated' },
      () => {
        if (typeof onUpdate === 'function') {
          onUpdate({ type: 'broadcast_commissions' })
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        realtimeChannelInstance = matrixChannel
      }
    })

  return () => {
    if (matrixChannel) {
      try {
        matrixChannel.unsubscribe()
      } catch { }
      matrixChannel = null
      realtimeChannelInstance = null
    }
  }
}

export async function getSupabaseRbacUsers() {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'get_users')
      const res = await fetch(u)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) return { success: true, data: json.data }
      }
    } catch {}
  }
  if (!supabase) return { success: true, data: getRbacUsers() }
  try {
    const { data, error } = await supabase
      .from(RBAC_TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        tableMissing: error.code === 'PGRST205',
        error: error.message,
        data: [],
      }
    }

    const normalized = (data || [])
      .filter(
        (row) =>
          row.status !== 'system' &&
          !String(row.username || '').startsWith('__')
      )
      .map((row) => {
        let resolvedMuni = row.assigned_municipality || row.assignedMunicipality
        if (!resolvedMuni || resolvedMuni === ALL_MUNICIPALITIES) {
          const fromBranch = resolveMunicipalityFromBranch(row.branch)
          if (fromBranch && fromBranch !== ALL_MUNICIPALITIES) {
            resolvedMuni = fromBranch
          }
        }
        if (!resolvedMuni) {
          resolvedMuni = ALL_MUNICIPALITIES
        }
        return {
          id: row.id,
          username: row.username,
          password: row.password,
          name: row.name,
          role: row.role,
          roleLabel: row.role_label,
          branch: row.branch,
          assignedMunicipality: resolvedMuni,
          status: row.status,
          avatar: row.avatar,
          email: row.email,
          lastLogin: row.last_login ? new Date(row.last_login).toLocaleString() : 'Never',
          createdAt: row.created_at ? row.created_at.split('T')[0] : '',
        }
      })

    return { success: true, data: normalized }
  } catch (err) {
    return { success: false, error: err.message, data: [] }
  }
}

export async function saveRbacUserToSupabase(user) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'save_user')
      const pRes = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      if (pRes.ok) {
        const json = await pRes.json()
        return { success: true, data: json.data }
      }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase is not configured' }
  try {
    const payload = {
      id: user.id || `usr_${Date.now()}`,
      username: String(user.username || '').trim().toLowerCase(),
      password: String(user.password || '').trim(),
      name: user.name,
      role: user.role,
      role_label: user.roleLabel || user.role_label,
      branch: user.branch,
      status: user.status || 'active',
      avatar: user.avatar || user.name.substring(0, 2).toUpperCase(),
      email: user.email || `${user.username}@luckybetplay.ph`,
    }

    if (user.assignedMunicipality) {
      payload.assigned_municipality = user.assignedMunicipality
    }

    let { data, error } = await supabase
      .from(RBAC_TABLE_NAME)
      .upsert(payload, { onConflict: 'username' })
      .select()

    if (error && (error.code === '42703' || String(error.message).includes('assigned_municipality'))) {
      delete payload.assigned_municipality
      const retry = await supabase
        .from(RBAC_TABLE_NAME)
        .upsert(payload, { onConflict: 'username' })
        .select()
      data = retry.data
      error = retry.error
    }

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deleteRbacUserFromSupabase(id, username) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'delete_user')
      if (id) u.searchParams.set('id', id)
      if (username) u.searchParams.set('username', username)
      const pRes = await fetch(u)
      if (pRes.ok) return { success: true }
    } catch {}
  }
  if (!supabase) return { success: false, error: 'Supabase is not configured' }
  try {
    const cleanUser = username ? String(username).trim().toLowerCase() : ''
    const cleanId = id ? String(id).trim() : ''

    if (cleanUser.startsWith('__') || cleanId.startsWith('__')) {
      return { success: false, error: 'Protected system row cannot be deleted' }
    }

    let query = supabase.from(RBAC_TABLE_NAME).delete()
    if (cleanId && cleanUser) {
      query = query.or(`id.eq.${cleanId},username.eq.${cleanUser}`)
    } else if (cleanId) {
      query = query.eq('id', cleanId)
    } else if (cleanUser) {
      query = query.eq('username', cleanUser)
    } else {
      return { success: false, error: 'Target ID or Username is required to delete an account' }
    }

    const { error } = await query
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function seedDefaultUsersToSupabase(defaultUsers) {
  if (!supabase || !Array.isArray(defaultUsers) || defaultUsers.length === 0) return
  try {
    const existing = await getSupabaseRbacUsers()
    if (existing.success && existing.data && existing.data.length > 0) {
      return
    }

    for (const u of defaultUsers) {
      await saveRbacUserToSupabase({
        ...u,
        status: 'active',
        createdAt: new Date().toISOString(),
      })
    }
  } catch { }
}

export async function signInWithSupabase(identifier, password) {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  const email = formatSupabaseEmail(identifier)

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: String(password).trim(),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    }
  } catch (err) {
    return { success: false, error: err.message || 'An unexpected error occurred during cloud sign-in' }
  }
}

export async function signUpWithSupabase(email, password, metadata = {}) {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })

    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user, session: data.session }
  } catch (err) {
    return { success: false, error: err.message || 'Supabase registration failed' }
  }
}

export async function signOutFromSupabase() {
  if (!supabase) return { success: false }
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getSupabaseSession() {
  if (!supabase) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data?.session || null
  } catch {
    return null
  }
}

export const PAYOUT_SHORTAGE_TABLE_NAME = 'payout_shortage_replenishments'

export async function getPayoutShortagesFromSupabase(branch, claimDate) {
  if (!supabase) return { success: false, data: [] }
  try {
    const cleanBranch = String(branch || '').trim()
    let query = supabase
      .from(PAYOUT_SHORTAGE_TABLE_NAME)
      .select('*')
      .order('draw_number', { ascending: true })

    if (cleanBranch) {
      query = query.eq('branch', cleanBranch)
    }

    if (claimDate) {
      query = query.eq('claim_date', claimDate)
    }

    const { data, error } = await query

    if (error) {
      return {
        success: false,
        tableMissing: error.code === 'PGRST205' || (error.message && error.message.includes('not find the table')),
        error: error.message,
        data: [],
      }
    }

    const normalized = (data || []).map((row) => ({
      id: row.id,
      tellerName: row.teller_name,
      drawNumber: row.draw_number,
      claimDate: row.claim_date,
      amount: Number(row.amount) || 0,
      remarks: row.remarks || '',
      referenceNo: row.reference_no || '',
      status: row.status || 'claimed',
      createdAt: row.created_at,
      branch: row.branch,
    }))

    return { success: true, data: normalized }
  } catch (err) {
    return { success: false, error: err.message, data: [] }
  }
}

export async function savePayoutShortagesToSupabase(branch, claimDate, claimsArray) {
  if (!supabase) return { success: false, error: 'Supabase client is not configured' }
  try {
    const cleanBranch = String(branch || '').trim()
    if (!cleanBranch || !claimDate) {
      return { success: false, error: 'Branch and claim date are required' }
    }

    const payload = (claimsArray || []).map((item) => ({
      id: item.id || `psr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      branch: cleanBranch,
      claim_date: claimDate,
      teller_name: item.tellerName || '',
      draw_number: item.drawNumber ? String(item.drawNumber) : '1',
      amount: Number(item.amount) || 0,
      remarks: item.remarks || '',
      reference_no: item.referenceNo || '',
      status: item.status || 'claimed',
      updated_at: new Date().toISOString(),
    }))

    const { error: delError } = await supabase
      .from(PAYOUT_SHORTAGE_TABLE_NAME)
      .delete()
      .eq('branch', cleanBranch)
      .eq('claim_date', claimDate)

    if (delError && delError.code !== 'PGRST205') {
      console.warn('Failed to clean existing claims for date:', delError)
    }

    if (payload.length === 0) {
      return { success: true, count: 0 }
    }

    const { data, error } = await supabase
      .from(PAYOUT_SHORTAGE_TABLE_NAME)
      .insert(payload)
      .select()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, count: data?.length || payload.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deletePayoutShortageRowFromSupabase(id) {
  if (!supabase || !id) return { success: false, error: 'Supabase client is not configured' }
  try {
    const { error } = await supabase
      .from(PAYOUT_SHORTAGE_TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export const getCashierClaimsFromSupabase = getPayoutShortagesFromSupabase
export const saveCashierClaimsToSupabase = savePayoutShortagesToSupabase
export const deleteCashierClaimFromSupabase = deletePayoutShortageRowFromSupabase

export const AUDIT_LOGS_TABLE_NAME = 'rbac_audit_logs'

export async function getSupabaseAuditLogs() {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'get_audit_logs')
      const res = await fetch(u)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return { success: true, data: json.data }
        }
      }
    } catch {}
  }
  if (!supabase) return { success: true, data: getAuditLogs() }
  try {
    const { data, error } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', 'audit_logs')
      .maybeSingle()

    if (!error && data?.config && Array.isArray(data.config)) {
      return { success: true, data: data.config }
    }
    return { success: true, data: getAuditLogs() }
  } catch {
    return { success: true, data: getAuditLogs() }
  }
}

export async function saveSupabaseAuditLog(log) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'save_audit_log')
      const pRes = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
      if (pRes.ok) return { success: true }
    } catch {}
  }
  if (!supabase) return { success: false }
  try {
    const { data } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', 'audit_logs')
      .maybeSingle()
    const current = data?.config && Array.isArray(data.config) ? data.config : []
    const updated = [log, ...current.filter((l) => l.id !== log.id)].slice(0, 100)
    await supabase.from('rbac_matrix_config').upsert({
      id: 'audit_logs',
      config: updated,
      updated_at: new Date().toISOString(),
    })
    return { success: true }
  } catch {
    return { success: false }
  }
}

export const ACTIVE_SESSIONS_CONFIG_ID = 'active_sessions'

export function getSessionTokenFromUrl() {
  if (typeof window === 'undefined') return null

  if (window.name && window.name.startsWith('ses_')) {
    return window.name
  }

  const hash = window.location.hash || ''
  const match = hash.match(/session=([^&]+)/)
  if (match) {
    const token = decodeURIComponent(match[1])
    try { window.name = token } catch {}
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    } catch {}
    return token
  }

  return null
}

export function setSessionTokenInUrl(token) {
  if (typeof window === 'undefined') return
  try {
    window.name = token || ''
  } catch {}

  if (window.location.hash.includes('session=')) {
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    } catch {}
  }
}

export async function createCloudSession(user) {
  const token = 'ses_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
  const sessionUser = {
    ...user,
    token,
    lastActive: new Date().toISOString(),
  }

  setSessionTokenInUrl(token)

  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'create_session')
      const pRes = await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionUser),
      })
      if (pRes.ok) return sessionUser
    } catch {}
  }

  if (supabase) {
    try {
      const { data } = await supabase
        .from('rbac_matrix_config')
        .select('config')
        .eq('id', ACTIVE_SESSIONS_CONFIG_ID)
        .maybeSingle()

      const currentSessions = (data?.config && typeof data.config === 'object') ? data.config : {}
      currentSessions[token] = sessionUser

      await supabase
        .from('rbac_matrix_config')
        .upsert({
          id: ACTIVE_SESSIONS_CONFIG_ID,
          config: currentSessions,
          updated_at: new Date().toISOString(),
        })
    } catch (err) {
      console.warn('Failed to persist cloud session to Supabase:', err)
    }
  }

  return sessionUser
}

export async function getCloudSession() {
  const token = getSessionTokenFromUrl()
  if (!token) return null
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', ACTIVE_SESSIONS_CONFIG_ID)
      .maybeSingle()

    if (!error && data?.config && data.config[token]) {
      return data.config[token]
    }
  } catch (err) {
    console.warn('Failed to retrieve cloud session:', err)
  }

  setSessionTokenInUrl(null)
  return null
}

export async function updateCloudSession(token, updatedUser) {
  if (!token) return
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'create_session')
      await fetch(u, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedUser, token }),
      })
      return
    } catch {}
  }
  if (!token || !supabase) return
  try {
    const { data } = await supabase
      .from('rbac_matrix_config')
      .select('config')
      .eq('id', ACTIVE_SESSIONS_CONFIG_ID)
      .maybeSingle()

    const currentSessions = (data?.config && typeof data.config === 'object') ? data.config : {}
    currentSessions[token] = {
      ...currentSessions[token],
      ...updatedUser,
      token,
      lastActive: new Date().toISOString(),
    }

    await supabase
      .from('rbac_matrix_config')
      .upsert({
        id: ACTIVE_SESSIONS_CONFIG_ID,
        config: currentSessions,
        updated_at: new Date().toISOString(),
      })
  } catch (err) {
    console.warn('Failed to update cloud session:', err)
  }
}

export async function revokeCloudSession(token) {
  const targetToken = token || getSessionTokenFromUrl()
  setSessionTokenInUrl(null)

  if (targetToken && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'revoke_session')
      u.searchParams.set('token', targetToken)
      await fetch(u, { method: 'POST' })
      return
    } catch {}
  }

  if (targetToken && supabase) {
    try {
      const { data } = await supabase
        .from('rbac_matrix_config')
        .select('config')
        .eq('id', ACTIVE_SESSIONS_CONFIG_ID)
        .maybeSingle()

      if (data?.config && data.config[targetToken]) {
        const nextSessions = { ...data.config }
        delete nextSessions[targetToken]

        await supabase
          .from('rbac_matrix_config')
          .upsert({
            id: ACTIVE_SESSIONS_CONFIG_ID,
            config: nextSessions,
            updated_at: new Date().toISOString(),
          })
      }
    } catch {}
  }
}

export async function bootFromCloud(sessionToken) {
  if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
    try {
      const u = new URL('/api/proxy', window.location.origin)
      u.searchParams.set('action', 'boot')
      if (sessionToken) u.searchParams.set('token', sessionToken)
      const res = await fetch(u)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          if (data.matrix) {
            if (data.matrix.roles) setInternalRbacRoles(data.matrix.roles)
            if (data.matrix.userPerms) setInternalUserCustomPerms(data.matrix.userPerms)
          }
          if (data.commissions) setInternalCommissionSettings(data.commissions)
          if (Array.isArray(data.users) && data.users.length > 0) setInternalRbacUsers(data.users)
          if (Array.isArray(data.logs) && data.logs.length > 0) setInternalAuditLogs(data.logs)

          window.dispatchEvent(new CustomEvent('luckybet_rbac_change', { detail: { source: 'boot_proxy' } }))
          window.dispatchEvent(new CustomEvent('luckybet_commissions_updated', { detail: data.commissions, source: 'boot_proxy' }))
          return data
        }
      }
    } catch (e) {
      console.warn('Proxy boot error, falling back:', e)
    }
  }

  const [matrixRes, commRes, usersRes] = await Promise.all([
    syncMatrixPermissionsFromSupabase().catch(() => null),
    syncCommissionSettingsFromSupabase().catch(() => null),
    getSupabaseRbacUsers().catch(() => null),
  ])
  return {
    matrix: matrixRes?.config,
    commissions: commRes?.settings,
    users: usersRes?.data || [],
  }
}
