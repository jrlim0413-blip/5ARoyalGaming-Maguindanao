export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://zcautuharvzntfbmling.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjYXV0dWhhcnZ6bnRmYm1saW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDA5OTQsImV4cCI6MjEwNzIxNjk5NH0.AjZkT3Voujg-84-JjLRNzd8QjqbE8pSL8CwoJmg0iJ0';
  const authBearer = process.env.VITE_AUTHORIZATION || '63211|6Jbvi41XijqCHw5eW2UpAvlbEGA8hOvsZHr1gZbV';

  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const defaultUsers = [
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
  ];

  const defaultLogs = [
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
  ];

  function normalizeUser(row) {
    if (!row || typeof row !== 'object') return null;
    return {
      id: row.id || `usr_${Date.now()}`,
      username: row.username || '',
      password: row.password || '',
      name: row.name || row.username || 'User',
      role: row.role || 'staff',
      roleLabel: row.role_label || row.roleLabel || (row.role === 'admin' ? 'System Administrator' : row.role === 'accountant' ? 'Head Cashier' : row.role === 'supervisor' ? 'Branch Supervisor' : 'Terminal Staff'),
      branch: row.branch || 'Maguindanao HQ',
      assignedMunicipality: row.assigned_municipality || row.assignedMunicipality || 'All Municipalities',
      status: row.status || 'active',
      avatar: row.avatar || (row.name ? row.name.substring(0, 2).toUpperCase() : 'US'),
      email: row.email || '',
      lastLogin: row.last_login ? new Date(row.last_login).toLocaleString() : (row.lastLogin || 'Never'),
      createdAt: row.created_at ? String(row.created_at).split('T')[0] : (row.createdAt || '2026-01-01'),
    };
  }

  const { action, type, from, to, drawId, id, token, username } = req.query || {};

  if (action === 'boot') {
    try {
      const [matrixRes, commRes, usersRes, logsRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.matrix_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.commissions_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_users?select=*&order=created_at.desc`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.audit_logs&select=config`, { headers: supaHeaders }),
      ]);
      const matrixData = await matrixRes.json();
      const commData = await commRes.json();
      const usersData = await usersRes.json();
      const logsData = await logsRes.json();

      let sessionUser = null;
      if (token) {
        const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
        const sesData = await sesRes.json();
        if (sesData?.[0]?.config?.[token]) {
          sessionUser = sesData[0].config[token];
        }
      }

      let parsedUsers = Array.isArray(usersData) && usersData.length > 0 ? usersData.map(normalizeUser).filter(Boolean) : defaultUsers;
      let parsedLogs = logsData?.[0]?.config && Array.isArray(logsData[0].config) && logsData[0].config.length > 0 ? logsData[0].config : defaultLogs;

      return res.status(200).json({
        success: true,
        matrix: matrixData?.[0]?.config || null,
        commissions: commData?.[0]?.config || null,
        users: parsedUsers,
        logs: parsedLogs,
        sessionUser,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'get_matrix') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.matrix_config&select=config`, { headers: supaHeaders });
      const data = await r.json();
      return res.status(200).json({ success: true, config: data?.[0]?.config || null });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'get_commissions') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.commissions_config&select=config`, { headers: supaHeaders });
      const data = await r.json();
      return res.status(200).json({ success: true, settings: data?.[0]?.config || null });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'get_users') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_users?select=*&order=created_at.desc`, { headers: supaHeaders });
      const data = await r.json();
      const usersList = Array.isArray(data) && data.length > 0 ? data.map(normalizeUser).filter(Boolean) : defaultUsers;
      return res.status(200).json({ success: true, data: usersList });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message, data: defaultUsers });
    }
  }

  if (action === 'get_audit_logs') {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.audit_logs&select=config`, { headers: supaHeaders });
      const data = await r.json();
      const logs = data?.[0]?.config && Array.isArray(data[0].config) && data[0].config.length > 0 ? data[0].config : defaultLogs;
      return res.status(200).json({ success: true, data: logs });
    } catch (err) {
      return res.status(200).json({ success: true, data: defaultLogs });
    }
  }

  if (action === 'save_audit_log') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const getRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.audit_logs&select=config`, { headers: supaHeaders });
      const getData = await getRes.json();
      const currentLogs = getData?.[0]?.config && Array.isArray(getData[0].config) ? getData[0].config : defaultLogs;
      const updatedLogs = [body, ...currentLogs.filter((l) => l.id !== body.id)].slice(0, 100);

      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'audit_logs',
          config: updatedLogs,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'save_matrix') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'matrix_config',
          config: body,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'save_commissions') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'commissions_config',
          config: body,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'save_user') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const row = {
        id: body.id,
        username: body.username,
        password: body.password,
        name: body.name,
        role: body.role,
        role_label: body.roleLabel || body.role_label,
        branch: body.branch,
        status: body.status || 'active',
        avatar: body.avatar,
        email: body.email,
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_users`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(row),
      });
      const data = await r.json();
      return res.status(r.status).json({ success: r.ok, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'delete_user') {
    try {
      const targetId = id || req.query.id;
      const targetUsername = username || req.query.username;
      let queryParam = '';
      if (targetId && targetUsername) {
        queryParam = `or=(id.eq.${targetId},username.eq.${targetUsername})`;
      } else if (targetId) {
        queryParam = `id=eq.${targetId}`;
      } else if (targetUsername) {
        queryParam = `username=eq.${targetUsername}`;
      }
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_users?${queryParam}`, {
        method: 'DELETE',
        headers: supaHeaders,
      });
      return res.status(r.status).json({ success: r.ok });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'create_session') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
      const sesData = await sesRes.json();
      const current = sesData?.[0]?.config || {};
      current[body.token] = body;

      await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'active_sessions',
          config: current,
          updated_at: new Date().toISOString(),
        }),
      });
      return res.status(200).json({ success: true, session: body });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'revoke_session') {
    try {
      const targetToken = token || (typeof req.body === 'object' ? req.body?.token : null);
      if (targetToken) {
        const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
        const sesData = await sesRes.json();
        const current = sesData?.[0]?.config || {};
        delete current[targetToken];

        await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config`, {
          method: 'POST',
          headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({
            id: 'active_sessions',
            config: current,
            updated_at: new Date().toISOString(),
          }),
        });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (action === 'login') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const r = await fetch('https://stl-ldn-api.com/api/accountant/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  let targetUrl = '';
  const baseTeller = process.env.VITE_API_URL || 'https://stl-ldn-api.com/api/accountant/TellerGrossPerDay';
  const baseDraw = process.env.VITE_DRAW_API_URL || 'https://stl-ldn-api.com/api/accountant/GrossPerDraw';
  const baseOverall = process.env.VITE_OVERALL_API_URL || 'https://stl-ldn-api.com/api/accountant/OverAllReports';
  const baseSupervisor = process.env.VITE_MUNI_SUPERVISOR_API_URL || process.env.VITE_SUPERVISOR_API_URL || 'https://stl-mag-api.com/api/accountant/supervisor';

  if (type === 'overall') {
    const u = new URL(baseOverall.includes('?') ? baseOverall : `${baseOverall}?id=${id || 5}`);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    if (id) u.searchParams.set('id', id);
    targetUrl = u.toString();
  } else if (type === 'draw') {
    const u = new URL(baseDraw.includes('?') ? baseDraw : `${baseDraw}?id=${id || 5}`);
    if (drawId) u.searchParams.set('drawId', drawId);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    if (id) u.searchParams.set('id', id);
    targetUrl = u.toString();
  } else if (type === 'supervisor') {
    const u = new URL(baseSupervisor.includes('?') ? baseSupervisor : `${baseSupervisor}?id=${id || 2}`);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    if (id) u.searchParams.set('id', id);
    if (drawId) u.searchParams.set('drawId', drawId);
    targetUrl = u.toString();
  } else if (type === 'teller') {
    const u = new URL(baseTeller.includes('?') ? baseTeller : `${baseTeller}?id=${id || 5}`);
    if (from) u.searchParams.set('from', from);
    if (to) u.searchParams.set('to', to);
    if (id) u.searchParams.set('id', id);
    targetUrl = u.toString();
  }

  if (targetUrl) {
    try {
      const headers = {
        Accept: 'application/json',
      };
      const clientAuth = req.headers && (req.headers.authorization || req.headers.Authorization);
      const effectiveAuth = authBearer ? `Bearer ${authBearer}` : clientAuth;
      if (effectiveAuth) {
        headers['Authorization'] = effectiveAuth.startsWith('Bearer ') ? effectiveAuth : `Bearer ${effectiveAuth}`;
      }
      const apiRes = await fetch(targetUrl, { headers });
      const data = await apiRes.json();
      return res.status(apiRes.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Serverless proxy request failed' });
    }
  }

  return res.status(400).json({ error: 'Invalid or missing proxy request type/action' });
}
