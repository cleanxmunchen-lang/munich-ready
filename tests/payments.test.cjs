const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');
function runtime(overrides) {
  const cache = new Map();
  function load(file) {
    const filename = path.join(root, file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
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
function setup() {
  const orders = new Map(), hotels = new Map([['hotel', { id: 'hotel', commission_percent: 10 }]]);
  const failures = [], calls = [], sessions = new Map(), creates = [];
  const emptyUpdates = [];
  const db = { from(table) {
    let action = 'select', values, filters = [];
    const query = {
      select() { return query; },
      insert(value) { action = 'insert'; values = value; return query; },
      update(value) { action = 'update'; values = value; return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      is(key, value) { filters.push([key, value]); return query; },
      single: () => execute(), maybeSingle: () => execute(),
    };
    async function execute() {
      calls.push({ table, action, values });
      if (failures[0] === `${table}:${action}`) { failures.shift(); return { data: null, error: { message: 'SECRET_DO_NOT_LEAK' } }; }
      if (action === 'update' && emptyUpdates.length) { emptyUpdates.shift(); return { data: null, error: null }; }
      const rows = table === 'orders' ? orders : hotels;
      if (action === 'insert') {
        if (rows.has(values.id)) return { data: null, error: { code: '23505' } };
        const row = { stripe_session_id: null, stripe_payment_intent_id: null, hotel_commission: 0, created_at: new Date().toISOString(), ...JSON.parse(JSON.stringify(values)) };
        rows.set(row.id, row); return { data: structuredClone(row), error: null };
      }
      const row = [...rows.values()].find(row => filters.every(([key, value]) => row[key] === value));
      if (row && action === 'update') Object.assign(row, values);
      return { data: row ? structuredClone(row) : null, error: null };
    }
    return query;
  } };
  const stripe = {
    webhooks: { constructEvent(body, signature) { if (signature !== 'valid') throw Error('SECRET_DO_NOT_LEAK'); return JSON.parse(body); } },
    checkout: { sessions: {
      async create(params, options) {
        creates.push({ params, options });
        if (!sessions.has(options.idempotencyKey)) sessions.set(options.idempotencyKey, { id: `cs_${sessions.size + 1}`, status: 'open', url: 'https://example.invalid/pay', ...params });
        return sessions.get(options.idempotencyKey);
      },
      async retrieve(id) { return [...sessions.values()].find(session => session.id === id); },
    } },
  };
  const env = runtime({
    '@/lib/supabase': { supabaseAdmin: db }, '@/lib/stripe': { stripe },
    '@/lib/hotels': { getHotelByRef: async ref => ref === 'hotel01' ? { id: 'hotel', ref_code: ref, address: 'Hotel address' } : null, normalizeRef: ref => ref ?? '' },
  });
  const checkout = env.load('app/api/checkout/route.ts').POST;
  const webhook = env.load('app/api/stripe/webhook/route.ts').POST;
  const input = { locale: 'en', items: [{ kind: 'kit', id: 'power-kit', quantity: 1, cableType: 'lightning-cable' }], deliveryType: 'hotel', refCode: 'hotel01', customerName: 'Test Guest', phone: '12345678', destination: 'Hotel address' };
  function submit(key, overrides = {}) { return checkout(new Request('http://localhost/api/checkout', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ ...input, ...overrides }) })); }
  function event(order, overrides = {}, type = 'checkout.session.completed', signature = 'valid') {
    return webhook(new Request('http://localhost/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: JSON.stringify({ id: 'evt_test', type, data: { object: {
      id: order.stripe_session_id, metadata: { orderId: order.id }, payment_status: 'paid', currency: 'eur', amount_total: order.total, payment_intent: 'pi_test', ...overrides,
    } } }) }));
  }
  return { orders, hotels, failures, emptyUpdates, calls, sessions, creates, submit, event, env };
}
process.env.STRIPE_WEBHOOK_SECRET = 'local-test-placeholder';

test('duplicate and concurrent checkout submissions reuse one order/session and preserve pricing, cable and attribution', async () => {
  const app = setup(), key = randomUUID();
  const responses = await Promise.all([app.submit(key), app.submit(key), app.submit(key)]);
  assert(responses.every(response => response.status === 200));
  assert.equal(app.orders.size, 1); assert.equal(app.sessions.size, 1);
  assert(app.creates.every(call => call.options.idempotencyKey === `checkout:${key}`));
  const order = app.orders.get(key), params = app.creates[0].params;
  assert.equal(order.items[0].cableType, 'lightning-cable'); assert.equal(order.hotel_ref, 'hotel01');
  assert.equal(order.hotel_id, 'hotel');
  assert.equal(params.line_items.reduce((sum, item) => sum + item.price_data.unit_amount * item.quantity, 0), order.total);
  assert.equal(params.line_items.at(-1).price_data.unit_amount, order.delivery_fee);
  assert.equal((await app.submit(key, { customerName: 'Different Guest' })).status, 409);
  assert.equal(app.orders.size, 1);
});

test('failed session persistence withholds URL; retry saves the same session', async () => {
  const app = setup(), key = randomUUID(); app.failures.push('orders:update');
  const failed = await app.submit(key); assert.equal(failed.status, 503);
  const body = await failed.text(); assert(!body.includes('SECRET')); assert(!body.includes('https://'));
  assert.equal(app.orders.get(key).stripe_session_id, null);
  assert.equal((await app.submit(key)).status, 200);
  assert.equal(app.orders.size, 1); assert.equal(app.sessions.size, 1);
  assert.equal(app.orders.get(key).stripe_session_id, 'cs_1');
});

test('checkout insert/read failures are retryable and terminal sessions cannot create another session with the same key', async () => {
  const app = setup(), key = randomUUID(); app.failures.push('orders:insert');
  assert.equal((await app.submit(key)).status, 503); assert.equal(app.sessions.size, 0);
  assert.equal((await app.submit(key)).status, 200);
  app.failures.push('orders:select'); assert.equal((await app.submit(key)).status, 503);
  app.sessions.values().next().value.status = 'expired';
  assert.equal((await app.submit(key)).status, 409); assert.equal(app.sessions.size, 1);
});

test('webhook rejects unpaid, currency, amount, session and intent mismatches; signature errors cannot update orders', async () => {
  const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
  for (const change of [{ payment_status: 'unpaid' }, { currency: 'usd' }, { amount_total: order.total + 1 }, { amount_total: null }, { id: 'cs_other' }, { payment_intent: null }, { metadata: {} }]) {
    assert((await app.event(order, change)).status >= 400);
    assert.equal(order.payment_status, 'pending'); assert.equal(order.hotel_commission, 0);
  }
  assert.equal((await app.event(order, {}, undefined, 'invalid')).status, 400);
  order.currency = 'usd'; assert.equal((await app.event(order)).status, 422);
});

test('paid webhook is idempotent, concurrent deliveries are safe and commission excludes delivery', async () => {
  const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
  const results = await Promise.all([app.event(order), app.event(order)]);
  assert(results.every(response => response.status === 200));
  assert.equal(order.payment_status, 'paid'); assert.equal(order.hotel_commission, Math.round(order.subtotal * .1));
  assert.notEqual(order.hotel_commission, Math.round(order.total * .1));
  order.status = 'preparing'; const before = app.calls.length;
  app.hotels.get('hotel').commission_percent = 20;
  assert.equal((await app.event(order)).status, 200);
  assert.equal(order.status, 'preparing'); assert.equal(order.hotel_commission, Math.round(order.subtotal * .1));
  assert(!app.calls.slice(before).some(call => call.action === 'update' || call.table === 'hotels'));
  assert.equal((await app.event(order, { payment_intent: 'pi_other' })).status, 409);
  assert.equal((await app.event(order, {}, 'checkout.session.expired')).status, 200);
  assert.equal(order.payment_status, 'paid');
});

test('every required webhook database failure returns retryable failure without marking paid', async () => {
  for (const failure of ['orders:select', 'hotels:select', 'orders:update']) {
    const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
    app.failures.push(failure);
    const response = await app.event(order); assert.equal(response.status, 500);
    assert(!((await response.text()).includes('SECRET'))); assert.equal(order.payment_status, 'pending');
    assert.equal((await app.event(order)).status, 200); assert.equal(order.payment_status, 'paid');
  }
  const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
  app.hotels.clear(); assert.equal((await app.event(order)).status, 500);
  assert.equal(order.payment_status, 'pending');
  app.orders.clear(); assert.equal((await app.event(order)).status, 500);
});

test('expired webhook checks update failures and is idempotent', async () => {
  const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
  app.failures.push('orders:update');
  assert.equal((await app.event(order, {}, 'checkout.session.expired')).status, 500);
  assert.equal(order.payment_status, 'pending');
  assert.equal((await app.event(order, {}, 'checkout.session.expired')).status, 200);
  assert.equal(order.payment_status, 'expired');
  assert.equal((await app.event(order, {}, 'checkout.session.expired')).status, 200);
});

test('checkout UI locks immediately on double click, retains retry key after failure and changes it with payload', async t => {
  const React = require('react');
  const globals = { fetch: global.fetch, FormData: global.FormData, window: global.window };
  t.after(() => Object.assign(global, globals));
  const calls = []; let release;
  global.FormData = class { constructor(values) { this.values = values; } get(key) { return this.values[key] ?? ''; } };
  global.fetch = (url, options) => { calls.push(options); return new Promise(resolve => { release = resolve; }); };
  global.window = { location: { assign() {} } };
  const cart = { items: [{ kind: 'product', id: 'bag', quantity: 1 }], refCode: null, deliveryType: 'hotel' };
  const Checkout = runtime({
    react: { ...React, useState: initial => [initial, () => {}], useEffect() {}, useRef: initial => ({ current: initial }) },
    '@/components/cart-provider': { useCart: () => cart },
    '@/components/i18n-provider': { useI18n: () => ({ t: key => key, lang: 'en' }) },
  }).load('components/checkout-form.tsx').CheckoutForm;
  const form = Checkout(), event = { preventDefault() {}, currentTarget: { customerName: 'Test Guest', phone: '12345678', destination: 'Test Hotel' } };
  const first = form.props.onSubmit(event); await form.props.onSubmit(event); assert.equal(calls.length, 1);
  release({ ok: false, json: async () => ({ error: 'Try again' }) }); await first;
  const second = form.props.onSubmit(event); assert.equal(calls.length, 2);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  release({ ok: false, json: async () => ({ error: 'Try again' }) }); await second;
  event.currentTarget.customerName = 'Changed Guest';
  const third = form.props.onSubmit(event);
  assert.notEqual(calls[1].headers['Idempotency-Key'], calls[2].headers['Idempotency-Key']);
  release({ ok: true, json: async () => ({ url: 'https://example.invalid/pay' }) }); await third;
  await form.props.onSubmit(event); assert.equal(calls.length, 3);
});


test('zero-row persistence and webhook writes cannot silently report success', async () => {
  const app = setup(), key = randomUUID();
  app.emptyUpdates.push(true);
  assert.equal((await app.submit(key)).status, 409);
  assert.equal(app.orders.get(key).stripe_session_id, null);
  assert.equal((await app.submit(key)).status, 200);
  const order = app.orders.get(key);
  app.emptyUpdates.push(true);
  assert.equal((await app.event(order)).status, 409);
  assert.equal(order.payment_status, 'pending');
  app.emptyUpdates.push(true);
  assert.equal((await app.event(order, {}, 'checkout.session.expired')).status, 409);
  assert.equal(order.payment_status, 'pending');
});

test('non-referral order has zero commission and old unlinked attempts cannot recreate pruned Stripe keys', async () => {
  const app = setup(), key = randomUUID();
  assert.equal((await app.submit(key, { refCode: null })).status, 200);
  const order = app.orders.get(key);
  assert.equal((await app.event(order)).status, 200);
  assert.equal(order.hotel_commission, 0);
  assert(!app.calls.some(call => call.table === 'hotels'));
  const oldKey = randomUUID(); app.failures.push('orders:update');
  assert.equal((await app.submit(oldKey)).status, 503);
  app.orders.get(oldKey).created_at = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const before = app.creates.length;
  assert.equal((await app.submit(oldKey)).status, 409);
  assert.equal(app.creates.length, before);
});
