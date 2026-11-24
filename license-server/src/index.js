// TikTok Live Helper 授權伺服器 (Cloudflare Workers + D1)
const ACTIVE_MS = 48 * 3600 * 1000;          // 48 小時內有續期 = 佔用一個名額（腳本每天續期一次）
const TOKEN_MS = 48 * 3600 * 1000;         // 令牌有效 48 小時
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', 'access-control-max-age': '86400' };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', ...CORS } });
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
const fmt = (s) => s.replace(/(.{4})(?=.)/g, '$1-');

async function sign(env, payload) {
  const key = await crypto.subtle.importKey('jwk', JSON.parse(env.SIGN_KEY), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const body = b64u(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(body));
  return body + '.' + b64u(sig);
}

async function checkIn(env, code, dev, name, now) {
  code = norm(code); dev = String(dev || '').slice(0, 64);
  if (code.length < 8 || dev.length < 8) return { err: 'bad_request', s: 400 };
  const lic = await env.DB.prepare('SELECT * FROM licenses WHERE code=?').bind(code).first();
  if (!lic) return { err: 'invalid_code', s: 404 };
  if (lic.revoked) return { err: 'revoked', s: 403 };
  let exp = lic.expires_at;
  if (lic.plan === 'monthly' && !lic.started_at) {          // 首次啟用開始計時
    exp = now + (lic.days || 30) * 86400000;
    await env.DB.prepare('UPDATE licenses SET started_at=?, expires_at=? WHERE code=?').bind(now, exp, code).run();
  }
  if (exp && exp < now) return { err: 'expired', s: 403, exp };
  const mine = await env.DB.prepare('SELECT dev FROM devices WHERE code=? AND dev=?').bind(code, dev).first();
  if (!mine) {
    const r = await env.DB.prepare('SELECT COUNT(*) n FROM devices WHERE code=? AND last_seen>?').bind(code, now - ACTIVE_MS).first();
    if ((r.n || 0) >= lic.max_dev) return { err: 'device_limit', s: 409, max: lic.max_dev };
    await env.DB.prepare('INSERT INTO devices(code,dev,name,first_seen,last_seen) VALUES(?,?,?,?,?)').bind(code, dev, String(name || '').slice(0, 60), now, now).run();
  } else {
    // 已登記的設備：若已閒置，重新佔用名額前要確認沒超限
    const r = await env.DB.prepare('SELECT COUNT(*) n FROM devices WHERE code=? AND dev<>? AND last_seen>?').bind(code, dev, now - ACTIVE_MS).first();
    if ((r.n || 0) >= lic.max_dev) return { err: 'device_limit', s: 409, max: lic.max_dev };
    await env.DB.prepare('UPDATE devices SET last_seen=?, name=COALESCE(NULLIF(?,\'\'),name) WHERE code=? AND dev=?').bind(now, String(name || '').slice(0, 60), code, dev).run();
  }
  const tokExp = exp ? Math.min(exp, now + TOKEN_MS) : now + TOKEN_MS;
  const token = await sign(env, { v: 1, dev, plan: lic.plan, iat: now, exp: tokExp, lic: exp || 0 });
  return { ok: true, token, plan: lic.plan, exp: exp || 0, max: lic.max_dev };
}

async function admin(req, env, url, now) {
  const a = req.headers.get('authorization') || '';
  if (!env.ADMIN_KEY || a !== 'Bearer ' + env.ADMIN_KEY) return J({ err: 'unauthorized' }, 401);
  const p = url.pathname;
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  if (p === '/admin/create') {                 // {plan:'monthly'|'lifetime', days:30, count:5, max_dev:10, note:''}
    const plan = body.plan === 'lifetime' ? 'lifetime' : 'monthly';
    const count = Math.min(Math.max(+body.count || 1, 1), 100), out = [];
    for (let i = 0; i < count; i++) {
      const raw = Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 32]).join('');
      await env.DB.prepare('INSERT INTO licenses(code,plan,max_dev,days,expires_at,note,created_at) VALUES(?,?,?,?,NULL,?,?)')
        .bind(raw, plan, +body.max_dev || 10, plan === 'monthly' ? (+body.days || 30) : null, String(body.note || '').slice(0, 100), now).run();
      out.push(fmt(raw));
    }
    return J({ ok: true, codes: out });
  }
  if (p === '/admin/list') {
    const r = await env.DB.prepare('SELECT l.code,l.plan,l.max_dev,l.days,l.started_at,l.expires_at,l.revoked,l.note,(SELECT COUNT(*) FROM devices d WHERE d.code=l.code AND d.last_seen>?) active,(SELECT COUNT(*) FROM devices d WHERE d.code=l.code) total FROM licenses l ORDER BY l.created_at DESC LIMIT 500').bind(now - ACTIVE_MS).all();
    return J({ ok: true, rows: r.results.map((x) => ({ ...x, code: fmt(x.code) })) });
  }
  if (p === '/admin/revoke') { await env.DB.prepare('UPDATE licenses SET revoked=? WHERE code=?').bind(body.undo ? 0 : 1, norm(body.code)).run(); return J({ ok: true }); }
  if (p === '/admin/extend') { await env.DB.prepare('UPDATE licenses SET expires_at=COALESCE(expires_at,?)+?*86400000 WHERE code=?').bind(now, +body.days || 30, norm(body.code)).run(); return J({ ok: true }); }
  if (p === '/admin/kick') { await env.DB.prepare('DELETE FROM devices WHERE code=?').bind(norm(body.code)).run(); return J({ ok: true }); }
  if (p === '/admin/devices') { const r = await env.DB.prepare('SELECT dev,name,first_seen,last_seen FROM devices WHERE code=? ORDER BY last_seen DESC').bind(norm(body.code)).all(); return J({ ok: true, rows: r.results }); }
  return J({ err: 'not_found' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), now = Date.now();
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (url.pathname.startsWith('/admin/')) return await admin(req, env, url, now);
      if (url.pathname === '/api/ping') return J({ ok: true, t: now });
      if (url.pathname === '/api/activate' || url.pathname === '/api/refresh') {
        const b = await req.json().catch(() => ({}));
        const r = await checkIn(env, b.code, b.dev, b.name, now);
        return r.ok ? J(r) : J(r, r.s);
      }
      if (url.pathname === '/api/deactivate') {
        const b = await req.json().catch(() => ({}));
        await env.DB.prepare('DELETE FROM devices WHERE code=? AND dev=?').bind(norm(b.code), String(b.dev || '')).run();
        return J({ ok: true });
      }
    } catch (e) { return J({ err: 'server_error', msg: String(e && e.message || e) }, 500); }
    return env.ASSETS.fetch(req);
  },
};
