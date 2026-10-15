export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://snemagtefsfuagzdhzmq.supabase.co';
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZW1hZ3RlZnNmdWFnemRoem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDg4NjgsImV4cCI6MjEwNzM4NDg2OH0.Pym6MwNdX9vMDk-zbOGqCqfCjYUZqxMl9kpkwQfTo_A';
  const authBearer = process.env.VITE_AUTHORIZATION || '63211|6Jbvi41XijqCHw5eW2UpAvlbEGA8hOvsZHr1gZbV';

  const supaHeaders = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const { action, type, from, to, drawId, id, token, username } = req.query || {};

  if (action === 'boot') {
    try {
      const [matrixRes, commRes, usersRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.matrix_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.commissions_config&select=config`, { headers: supaHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/rbac_users?select=*&order=created_at.desc`, { headers: supaHeaders }),
      ]);
      const matrixData = await matrixRes.json();
      const commData = await commRes.json();
      const usersData = await usersRes.json();

      let sessionUser = null;
      if (token) {
        const sesRes = await fetch(`${SUPABASE_URL}/rest/v1/rbac_matrix_config?id=eq.active_sessions&select=config`, { headers: supaHeaders });
        const sesData = await sesRes.json();
        if (sesData?.[0]?.config?.[token]) {
          sessionUser = sesData[0].config[token];
        }
      }

      return res.status(200).json({
        success: true,
        matrix: matrixData?.[0]?.config || null,
        commissions: commData?.[0]?.config || null,
        users: Array.isArray(usersData) ? usersData : [],
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
      return res.status(200).json({ success: true, data: Array.isArray(data) ? data : [] });
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
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rbac_users`, {
        method: 'POST',
        headers: { ...supaHeaders, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(body),
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
