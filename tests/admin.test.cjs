/* Run the existing TypeScript modules without adding a test runtime dependency. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const password = 'test-only-owner-password-4dbe8eaf';
const orderId = 'f3f37dd5-8473-42af-8058-7bc5df834424';

function runtime(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(root, file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    function importModule(name) {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) {
        const base = name.slice(2);
        return load([`${base}.ts`, `${base}.tsx`].find(p => fs.existsSync(path.resolve(root, p))));
      }
      return require(name);
    }
    new Function('require', 'module', 'exports', code)(importModule, mod, mod.exports);
    return mod.exports;
  }
  return { load };
}
function withPassword(t, value = password) {
  const previous = process.env.ADMIN_PASSWORD;
  if (value === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = value;
  t.after(() => { if (previous === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = previous; });
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
function context() {
  let token;
  const queries = [];
  let databaseResult = { data: { id: orderId, status: 'preparing' }, error: null };
  const database = { from(table) {
    queries.push(['from', table]);
    const chain = {};
    for (const method of ['update', 'eq', 'select', 'order', 'limit']) chain[method] = (...args) => { queries.push([method, ...args]); return chain; };
    chain.maybeSingle = async () => databaseResult;
    chain.returns = async () => databaseResult;
    return chain;
  } };
  const env = runtime({
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    'next/navigation': { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } },
    '@/lib/supabase': { supabaseAdmin: database },
  });
  return { ...env, queries, setToken: value => { token = value; }, setResult: value => { databaseResult = value; } };
}
const request = (body, url = '/api/admin/login') => new Request(`http://localhost${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

 test('signed sessions reject plaintext, missing config, tampering, expiry, and a changed password', () => {
  const session = runtime().load('lib/admin-session.ts');
  const token = session.createAdminSession(password, 100000);
  assert(!token.includes(password));
  assert(session.verifyAdminSession(token, password, 100000));
  assert(session.verifyAdminSession(token, password, 128799));
  for (const [value, secret, time] of [
    [token, password, 128800], [token, password, 99999], [token, 'changed', 100000],
    [token, null, 100000], [token, '', 100000], [undefined, null, 100000],
    [password, password, 100000], [token + 'x', password, 100000],
    [token.replace('128800', '228800'), password, 100000],
    [token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'), password, 100000],
  ]) assert.equal(session.verifyAdminSession(value, secret, time), false);
  assert.notEqual(token, session.createAdminSession(password, 100000));
  assert.throws(() => session.createAdminSession(''), /not configured/);
 });

test('login is outside the protected layout and renders without an admin session', () => {
  assert(!fs.existsSync(path.join(root, 'app/admin/layout.tsx')));
  assert(fs.existsSync(path.join(root, 'app/admin/(protected)/layout.tsx')));
  const { default: Login } = runtime().load('app/admin/login/page.tsx');
  const html = renderToStaticMarkup(React.createElement(Login));
  assert(html.includes('Admin sign in'));
  assert(html.includes('type="password"'));
});

test('both protected pages and their layout redirect before querying storage when logged out', async t => {
  withPassword(t);
  const env = context();
  for (const file of ['layout', 'orders/page', 'hotels/page']) {
    const Page = env.load(`app/admin/(protected)/${file}.tsx`).default;
    await assert.rejects(Page({ children: null }), /REDIRECT:\/admin\/login/);
  }
  assert.equal(env.queries.length, 0);
});

test('wrong passwords fail, correct login sets a secure eight-hour signed cookie, logout clears it', async t => {
  withPassword(t);
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  t.after(() => { if (previousMode === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousMode; });
  const env = context();
  const { POST } = env.load('app/api/admin/login/route.ts');
  for (const candidate of ['wrong', '', null]) {
    const response = await POST(request({ password: candidate }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  const response = await POST(request({ password }));
  assert.equal(response.status, 200);
  const cookie = response.cookies.get('munich_ready_admin');
  assert(cookie.value && !cookie.value.includes(password));
  const header = response.headers.get('set-cookie');
  for (const expected of ['HttpOnly', 'Secure', 'SameSite=strict', 'Max-Age=28800']) assert(header.includes(expected), header);
  env.setToken(cookie.value);
  assert.equal(await env.load('lib/admin-auth.ts').getAdminAuthStatus(), 'authenticated');
  const layout = await env.load('app/admin/(protected)/layout.tsx').default({ children: 'Private content' });
  assert(renderToStaticMarkup(layout).includes('/api/admin/logout'));
  const logout = await env.load('app/api/admin/logout/route.ts').POST(request({}, '/api/admin/logout'));
  assert.equal(logout.status, 303);
  assert.equal(logout.headers.get('location'), 'http://localhost/admin/login');
  assert.equal(logout.cookies.get('munich_ready_admin').value, '');
  assert(logout.headers.get('set-cookie').includes('Max-Age=0'));
  env.setToken('');
  await assert.rejects(env.load('lib/admin-auth.ts').requireAdmin(), /REDIRECT/);
});

test('missing, empty, and blank ADMIN_PASSWORD deny pages and API even with an existing session', async t => {
  withPassword(t);
  const env = context();
  const token = env.load('lib/admin-session.ts').createAdminSession(password);
  for (const missing of [undefined, '', '   ']) {
    if (missing === undefined) delete process.env.ADMIN_PASSWORD; else process.env.ADMIN_PASSWORD = missing;
    for (const cookie of [undefined, token]) {
      env.setToken(cookie);
      for (const file of ['layout', 'orders/page', 'hotels/page']) await assert.rejects(env.load(`app/admin/(protected)/${file}.tsx`).default({ children: null }), /not configured/);
      const login = await env.load('app/api/admin/login/route.ts').POST(request({ password }));
      assert.equal(login.status, 503);
      assert.equal(login.headers.get('set-cookie'), null);
      const update = await env.load('app/api/admin/orders/[id]/route.ts').PATCH(request({ status: 'preparing' }), { params: Promise.resolve({ id: orderId }) });
      assert.equal(update.status, 503);
    }
  }
  assert.equal(env.queries.length, 0);
});

test('status API enforces sessions and paid orders, confirms writes, and reports failed/zero-row writes', async t => {
  withPassword(t);
  const env = context();
  const { PATCH } = env.load('app/api/admin/orders/[id]/route.ts');
  const update = (status = 'preparing') => PATCH(request({ status }), { params: Promise.resolve({ id: orderId }) });
  for (const cookie of [undefined, password, 'forged']) {
    env.setToken(cookie);
    assert.equal((await update()).status, 401);
  }
  assert.equal(env.queries.length, 0);
  env.setToken(env.load('lib/admin-session.ts').createAdminSession(password));
  assert.equal((await update('refunded')).status, 400);
  for (const status of ['preparing', 'out_for_delivery', 'delivered', 'cancelled']) {
    env.setResult({ data: { id: orderId, status }, error: null });
    const response = await update(status);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, status });
  }
  assert(env.queries.some(q => q[0] === 'eq' && q[1] === 'payment_status' && q[2] === 'paid'));
  for (const q of env.queries.filter(q => q[0] === 'update')) assert.deepEqual(Object.keys(q[1]), ['status']);
  env.setResult({ data: null, error: null });
  assert.equal((await update()).status, 409);
  env.setResult({ data: null, error: { message: 'private database error' } });
  const failure = await update();
  assert.equal(failure.status, 500);
  assert(!(await failure.text()).includes('private database error'));
});

test('order table includes the requested fields and shows an authenticated customer order', async t => {
  withPassword(t);
  const env = context();
  env.setToken(env.load('lib/admin-session.ts').createAdminSession(password));
  env.setResult({ data: [{ id: orderId, order_number: 'MR-TEST', created_at: '2026-09-10T12:00:00Z', customer_name: 'Test Guest', room_number: '123', phone: '00000', delivery_address: 'Test address', delivery_type: 'express', hotel_ref: 'hotel-test', special_instructions: 'Leave at reception', subtotal: 2490, delivery_fee: 1490, total: 3980, hotel_commission: 374, payment_status: 'paid', status: 'paid', hotels: { name: 'Test Hotel' }, items: [{ name: 'Essential Kit', quantity: 1, cableType: 'lightning-cable' }] }], error: null });
  const markup = renderToStaticMarkup(await env.load('app/admin/(protected)/orders/page.tsx').default());
  for (const label of ['MR-TEST', 'Lightning', 'Leave at reception', 'Express Delivery', 'hotel-test', 'Commission:', 'Subtotal:', 'Delivery:', 'Total:', 'Payment', 'Fulfilment']) assert(markup.includes(label), label);
  const select = env.queries.find(q => q[0] === 'select')[1];
  for (const field of ['special_instructions', 'hotel_ref', 'hotel_commission', 'delivery_type', 'subtotal', 'delivery_fee']) assert(select.includes(field));
  assert(!select.includes('stripe'));
});

function statusHarness() {
  const state = []; let cursor = 0;
  const env = runtime({ react: {
    ...React,
    useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
    useEffect() {},
  } });
  const { OrderStatus } = env.load('components/order-status.tsx');
  return { render(props = {}) { cursor = 0; return OrderStatus({ id: orderId, status: 'paid', ...props }); } };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('status control waits for success, displays saving, retains the previous value on HTTP/network failure', async t => {
  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  const ui = statusHarness();
  let resolve;
  global.fetch = () => new Promise(done => { resolve = done; });
  const select = tree => nodes(tree).find(n => n.type === 'select');
  select(ui.render()).props.onChange({ target: { value: 'preparing' } });
  assert.equal(select(ui.render()).props.value, 'paid');
  assert.equal(select(ui.render()).props.disabled, true);
  assert(nodes(ui.render()).some(n => n.props?.role === 'status'));
  resolve({ ok: true, json: async () => ({ ok: true, status: 'preparing' }) });
  await flush();
  assert.equal(select(ui.render()).props.value, 'preparing');
  assert.equal(select(ui.render()).props.disabled, false);
  for (const fail of [async () => ({ ok: false, json: async () => ({ error: 'Unable to save' }) }), async () => { throw new Error('Network unavailable'); }]) {
    global.fetch = fail;
    select(ui.render()).props.onChange({ target: { value: 'delivered' } });
    await flush();
    assert.equal(select(ui.render()).props.value, 'preparing');
    assert.equal(select(ui.render()).props.disabled, false);
    assert(nodes(ui.render()).some(n => n.props?.role === 'alert'));
  }
  assert.equal(select(ui.render({ editable: false })).props.disabled, true);
});
