const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const QRCode = require('qrcode');
const { renderToStaticMarkup } = require('react-dom/server');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');
function runtime(overrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} }; cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020,
    } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) return load([name.slice(2) + '.ts', name.slice(2) + '.tsx'].find(file => fs.existsSync(path.join(root, file))));
      return require(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  return { load };
}
const details = { name: 'Partner Hotel', address: 'Munich 1', ref_code: 'partner01', commission_percent: 15, active: true };
function setup() {
  const rows = new Map(), calls = [];
  let auth = 'authenticated', fail = false;
  const database = { from(table) {
    calls.push(table); assert.equal(table, 'hotels');
    let action, fields, id;
    const chain = {
      insert(value) { action = 'insert'; fields = value; return chain; },
      update(value) { action = 'update'; fields = value; return chain; },
      eq(key, value) { assert.equal(key, 'id'); id = value; return chain; },
      select() { return chain; },
      async maybeSingle() {
        if (fail) return { data: null, error: { message: 'SECRET_NOT_FOR_RESPONSE' } };
        if (action === 'update' && !rows.has(id)) return { data: null, error: null };
        if ([...rows.values()].some(row => row.ref_code === fields.ref_code && row.id !== id)) return { data: null, error: { code: '23505' } };
        if (action === 'insert') id = randomUUID();
        const row = { ...rows.get(id), id, ...fields }; rows.set(id, row);
        return { data: structuredClone(row), error: null };
      },
    }; return chain;
  } };
  const env = runtime({ '@/lib/admin-auth': { getAdminAuthStatus: async () => auth }, '@/lib/supabase': { supabaseAdmin: database } });
  const post = env.load('app/api/admin/hotels/route.ts').POST;
  const patch = env.load('app/api/admin/hotels/[id]/route.ts').PATCH;
  function send(body, id, headers = {}) {
    const request = new Request(`https://munichready.store/api/admin/hotels${id ? '/' + id : ''}`, {
      method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
    });
    return id ? patch(request, { params: Promise.resolve({ id }) }) : post(request);
  }
  return { rows, calls, send, setAuth: value => { auth = value; }, setFail: value => { fail = value; } };
}

test('hotel create/edit require existing admin authentication before any database access', async () => {
  const app = setup();
  for (const [auth, status] of [['unauthenticated', 401], ['unconfigured', 503]]) {
    app.setAuth(auth);
    for (const id of [undefined, randomUUID()]) assert.equal((await app.send(details, id)).status, status);
  }
  assert.equal(app.calls.length, 0);
});

test('hotel creation defaults to 15% and active; duplicate codes are rejected including concurrent normalized codes', async () => {
  const app = setup();
  const results = await Promise.all([app.send({ name: 'First Hotel', ref_code: ' Partner01 ' }), app.send({ name: 'Second Hotel', ref_code: 'partner01' })]);
  assert.deepEqual(results.map(res => res.status).sort(), [201, 409]);
  assert.equal(app.rows.size, 1);
  const row = [...app.rows.values()][0];
  assert.equal(row.commission_percent, 15); assert.equal(row.active, true); assert.equal(row.address, null); assert.equal(row.ref_code, 'partner01');
  assert.equal((await app.send({ ...details, ref_code: 'partner02' })).status, 201);
});

test('editing preserves hotel identity and reporting; duplicate updates fail without replacing other hotels', async () => {
  const app = setup(); const first = await (await app.send(details)).json();
  const second = await (await app.send({ ...details, ref_code: 'second' })).json();
  const row = app.rows.get(first.hotel.id); row.orders = [{ subtotal: 2490, hotel_commission: 374, payment_status: 'paid' }];
  const response = await app.send({ ...details, name: 'New name', address: 'New address', commission_percent: 12.5, active: false }, row.id);
  assert.equal(response.status, 200);
  const updated = app.rows.get(row.id);
  assert.equal(updated.id, row.id); assert.equal(updated.active, false); assert.equal(updated.commission_percent, 12.5);
  assert.deepEqual(updated.orders, row.orders);
  assert.equal((await app.send({ ...details, ref_code: 'second' }, row.id)).status, 409);
  assert.equal(app.rows.get(row.id).ref_code, 'partner01');
  assert.equal(app.rows.get(second.hotel.id).ref_code, 'second');
  assert.equal((await app.send(details, randomUUID())).status, 404);
});

test('hotel input validation, same-origin checks and safe database errors', async () => {
  const app = setup();
  for (const value of [{ ...details, name: '' }, { ...details, ref_code: 'bad code' }, { ...details, ref_code: '../bad' },
    { ...details, commission_percent: -1 }, { ...details, commission_percent: 101 }, { ...details, commission_percent: 1.234 },
    { ...details, commission_percent: '15' }, { ...details, active: 'yes' }, { ...details, orders: [] }]) {
    assert.equal((await app.send(value)).status, 400);
  }
  assert.equal((await app.send(details, 'not-a-uuid')).status, 400);
  assert.equal((await app.send(details, undefined, { origin: 'https://attacker.invalid' })).status, 403);
  assert.equal((await app.send(details, undefined, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal(app.calls.length, 0);
  app.setFail(true);
  const response = await app.send(details); assert.equal(response.status, 500);
  assert(!(await response.text()).includes('SECRET_NOT_FOR_RESPONSE'));
});

function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}

test('hotel reports preserve paid totals, generate PNG/SVG for production domain and offer creation when empty', async t => {
  const previous = process.env.SITE_URL; process.env.SITE_URL = 'https://preview.vercel.app';
  t.after(() => { if (previous === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = previous; });
  let rows = [{ id: randomUUID(), ...details, orders: [
    { payment_status: 'paid', subtotal: 2490, hotel_commission: 374 },
    { payment_status: 'pending', subtotal: 9999, hotel_commission: 999 },
  ] }];
  const qrCalls = [];
  const env = runtime({
    '@/lib/admin-auth': { requireAdmin: async () => {} },
    '@/lib/supabase': { supabaseAdmin: { from: () => ({ select: () => ({ returns: async () => ({ data: rows, error: null }) }) }) } },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
    qrcode: {
      toDataURL: async (url, options) => { qrCalls.push(url); return QRCode.toDataURL(url, options); },
      toString: async (url, options) => { qrCalls.push(url); return QRCode.toString(url, options); },
    },
  });
  const Page = env.load('app/admin/(protected)/hotels/page.tsx').default;
  const tree = await Page(); const html = renderToStaticMarkup(tree);
  assert(html.includes('Paid orders: 1')); assert(html.includes('24.90')); assert(html.includes('3.74')); assert(!html.includes('99.99'));
  const Actions = env.load('components/admin-hotel-referral-actions.tsx').AdminHotelReferralActions;
  const actions = nodes(tree).find(node => node.type === Actions);
  assert.deepEqual(qrCalls, ['https://munichready.store/?ref=partner01', 'https://munichready.store/?ref=partner01']);
  assert.equal(actions.props.url, qrCalls[0]);
  assert.equal(Buffer.from(actions.props.png.split(',')[1], 'base64').subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(actions.props.svg.startsWith('<svg')); assert(html.includes('Download QR as PNG')); assert(html.includes('.svg'));
  rows = []; const empty = renderToStaticMarkup(await Page()); assert(empty.includes('Add hotel')); assert(empty.includes('No hotel partners yet'));
});

function hookRuntime(overrides = {}) {
  const state = []; let cursor = 0;
  const env = runtime({ react: { ...React,
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i]; },
  }, ...overrides });
  return { ...env, render(Component, props = {}) { cursor = 0; return Component(props); } };
}

test('editor retains form on failure, blocks duplicate submission, refreshes only after confirmed success', async t => {
  const savedFetch = global.fetch, savedFormData = global.FormData;
  t.after(() => { global.fetch = savedFetch; global.FormData = savedFormData; });
  global.FormData = class { constructor(values) { this.values = values; } get(key) { return this.values[key] ?? null; } };
  let refreshes = 0, release; const requests = [];
  global.fetch = async (url, options) => { requests.push({ url, options }); return new Promise(resolve => { release = resolve; }); };
  const env = hookRuntime({ 'next/navigation': { useRouter: () => ({ refresh() { refreshes++; } }) } });
  const Editor = env.load('components/admin-hotel-editor.tsx').AdminHotelEditor;
  const props = { hotel: { id: randomUUID(), ...details } };
  nodes(env.render(Editor, props)).find(node => node.type === 'button').props.onClick();
  let tree = env.render(Editor, props); const form = nodes(tree).find(node => node.type === 'form');
  const event = { preventDefault() {}, currentTarget: { name: 'New name', address: 'Address', commission_percent: '12.5' } };
  const pending = form.props.onSubmit(event); await form.props.onSubmit(event);
  assert.equal(requests.length, 1); assert.equal(refreshes, 0);
  assert(nodes(env.render(Editor, props)).find(node => node.type === 'fieldset').props.disabled);
  assert.equal(requests[0].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[0].options.body), { name: 'New name', address: 'Address', ref_code: 'partner01', commission_percent: 12.5, active: false });
  release({ ok: false, json: async () => ({ error: 'Referral already used' }) }); await pending;
  tree = env.render(Editor, props); assert(nodes(tree).some(node => node.props?.role === 'alert')); assert.equal(refreshes, 0);
  assert(nodes(tree).some(node => node.type === 'form'));
  const retry = nodes(tree).find(node => node.type === 'form').props.onSubmit(event);
  release({ ok: true, json: async () => ({ hotel: props.hotel }) }); await retry;
  tree = env.render(Editor, props); assert.equal(refreshes, 1); assert(!nodes(tree).some(node => node.type === 'form'));
});

test('referral actions download correct files and report clipboard success or failure', async t => {
  const original = Object.getOwnPropertyDescriptor(global, 'navigator');
  t.after(() => { if (original) Object.defineProperty(global, 'navigator', original); else delete global.navigator; });
  const copied = [];
  Object.defineProperty(global, 'navigator', { configurable: true, value: { clipboard: { writeText: async value => { copied.push(value); } } } });
  const env = hookRuntime(); const Actions = env.load('components/admin-hotel-referral-actions.tsx').AdminHotelReferralActions;
  const props = { url: 'https://munichready.store/?ref=hotel01', refCode: 'hotel01', png: 'data:image/png;base64,test', svg: '<svg>test</svg>' };
  let tree = env.render(Actions, props); const links = nodes(tree).filter(node => node.type === 'a');
  assert.equal(links[0].props.href, props.png); assert.equal(links[0].props.download, 'munich-ready-hotel01.png');
  assert.equal(decodeURIComponent(links[1].props.href.split(',')[1]), props.svg);
  assert.equal(links[1].props.download, 'munich-ready-hotel01.svg');
  await nodes(tree).find(node => node.type === 'button').props.onClick();
  assert.deepEqual(copied, [props.url]); tree = env.render(Actions, props);
  assert(nodes(tree).some(node => node.props?.children === 'Referral link copied.'));
  global.navigator.clipboard.writeText = async () => { throw Error('Unavailable'); };
  await nodes(tree).find(node => node.type === 'button').props.onClick();
  assert(nodes(env.render(Actions, props)).some(node => String(node.props?.children).includes('Unable to copy automatically')));
});

test('Supabase diagnostics retain operation/code/message/details and redact configured secrets', t => {
  const envNames = ['SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'TELEGRAM_BOT_TOKEN'];
  const previous = envNames.map(name => process.env[name]); const originalLog = console.error;
  t.after(() => {
    console.error = originalLog;
    envNames.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; });
  });
  envNames.forEach((name, i) => { process.env[name] = `private-credential-${i}`; });
  const logs = []; console.error = (...args) => logs.push(args);
  const { logHotelDatabaseError } = runtime().load('lib/admin-hotel-errors.ts');
  logHotelDatabaseError('hotels.insert', {
    code: '42703', message: 'column "address" does not exist',
    details: 'private-credential-0 private-credential-1 private-credential-2 Bearer auth-value https://user:pass@host.invalid sb_secret_othersecret',
    hint: 'Check the public.hotels schema.',
  });
  assert.equal(logs[0].length, 1);
  const entry = JSON.parse(logs[0][0].slice('[admin-hotels] supabase_error '.length));
  assert.equal(entry.operation, 'hotels.insert'); assert.equal(entry.code, '42703');
  assert.equal(entry.message, 'column "address" does not exist'); assert.equal(entry.hint, 'Check the public.hotels schema.');
  assert.equal(entry.configuration.serviceRoleKeyPresent, true);
  for (const secret of ['private-credential-0', 'private-credential-1', 'private-credential-2', 'auth-value', 'user:pass', 'sb_secret_othersecret']) assert(!logs[0][0].includes(secret));
});

test('real Supabase SDK loads/creates/edits using the existing schema and logs actual read/write failures', async t => {
  const { createClient } = require('@supabase/supabase-js');
  const originalLog = console.error; const logs = [], requests = [];
  console.error = line => logs.push(line);
  t.after(() => { console.error = originalLog; });
  let failure = null;
  const row = { id: randomUUID(), ...details, created_at: new Date().toISOString() };
  const database = createClient('https://test-project.supabase.co', 'test-service-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, options) => {
      const requestUrl = new URL(url); const headers = new Headers(options.headers);
      requests.push({ url: requestUrl, method: options.method, headers, body: options.body ? JSON.parse(options.body) : null });
      if (failure) return new Response(JSON.stringify(failure), { status: 400, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(options.method === 'GET' ? [{ ...row, orders: [] }] : row), {
        status: options.method === 'POST' ? 201 : 200, headers: { 'Content-Type': 'application/json' },
      });
    } },
  });
  const env = runtime({
    '@/lib/admin-auth': { requireAdmin: async () => {}, getAdminAuthStatus: async () => 'authenticated' },
    '@/lib/supabase': { supabaseAdmin: database },
    'next/navigation': { useRouter: () => ({ refresh() {} }) },
  });
  const Page = env.load('app/admin/(protected)/hotels/page.tsx').default;
  const POST = env.load('app/api/admin/hotels/route.ts').POST;
  const PATCH = env.load('app/api/admin/hotels/[id]/route.ts').PATCH;
  const request = () => new Request('https://munichready.store/api/admin/hotels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(details) });
  assert(renderToStaticMarkup(await Page()).includes('Partner Hotel'));
  assert.equal((await POST(request())).status, 201);
  assert.equal((await PATCH(request(), { params: Promise.resolve({ id: row.id }) })).status, 200);
  assert.deepEqual(requests.map(entry => entry.method), ['GET', 'POST', 'PATCH']);
  assert(requests.every(entry => entry.url.pathname === '/rest/v1/hotels' && entry.headers.get('apikey') === 'test-service-key'));
  assert.equal(requests[0].url.searchParams.get('select'), 'id,name,address,ref_code,commission_percent,active,orders(subtotal,payment_status,hotel_commission)');
  assert.deepEqual(requests[1].body, details);
  assert.equal(requests[2].url.searchParams.get('id'), `eq.${row.id}`);
  failure = { code: 'PGRST204', message: "Could not find the 'address' column of 'hotels' in the schema cache", details: null, hint: 'Check the schema cache.' };
  const pageHtml = renderToStaticMarkup(await Page()); assert(pageHtml.includes('Unable to load hotels'));
  const failed = await POST(request()); assert.equal(failed.status, 500);
  assert(!(await failed.text()).includes('schema cache'));
  const logEntries = logs.map(line => JSON.parse(line.slice('[admin-hotels] supabase_error '.length)));
  assert.deepEqual(logEntries.map(entry => entry.operation), ['hotels.select', 'hotels.insert']);
  assert(logEntries.every(entry => entry.code === failure.code && entry.message === failure.message && entry.hint === failure.hint));
});

test('server Supabase client uses SUPABASE_URL and service-role key, not public anon configuration', t => {
  const names = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const previous = names.map(name => process.env[name]);
  t.after(() => names.forEach((name, i) => { if (previous[i] === undefined) delete process.env[name]; else process.env[name] = previous[i]; }));
  process.env.SUPABASE_URL = 'https://server-project.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://wrong-project.supabase.co'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';
  const calls = []; const client = {};
  const overrides = { '@supabase/supabase-js': { createClient: (...args) => { calls.push(args); return client; } } };
  assert.equal(runtime(overrides).load('lib/supabase.ts').supabaseAdmin, client);
  assert.deepEqual(calls[0], ['https://server-project.supabase.co', 'fake-service-key', { auth: { persistSession: false } }]);
  delete process.env.SUPABASE_URL;
  assert.equal(runtime(overrides).load('lib/supabase.ts').supabaseAdmin, null);
  assert.equal(calls.length, 1);
});
