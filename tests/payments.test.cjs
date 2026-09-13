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
function setup(notify = async () => {}) {
  const orders = new Map(), hotels = new Map([['hotel', { id: 'hotel', name: 'Test Hotel', commission_percent: 10 }]]);
  const notifications = [];
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
    '@/lib/telegram': { notifyPaidOrder: async (order, hotelName) => {
      assert.equal(orders.get(order.id).payment_status, 'paid');
      notifications.push({ order: structuredClone(order), hotelName });
      await notify(order, hotelName);
    } },
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
  return { orders, hotels, failures, emptyUpdates, calls, sessions, creates, notifications, submit, event, env };
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
  assert.equal(app.notifications.length, 0);
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
  assert.equal(app.notifications.length, 1);
  assert.equal(app.notifications[0].hotelName, 'Test Hotel');
  assert.equal(app.notifications[0].order.hotel_commission, Math.round(order.subtotal * .1));
});

test('every required webhook database failure returns retryable failure without marking paid', async () => {
  for (const failure of ['orders:select', 'hotels:select', 'orders:update']) {
    const app = setup(), key = randomUUID(); await app.submit(key); const order = app.orders.get(key);
    app.failures.push(failure);
    const response = await app.event(order); assert.equal(response.status, 500);
    assert(!((await response.text()).includes('SECRET'))); assert.equal(order.payment_status, 'pending');
    assert.equal(app.notifications.length, 0);
    assert.equal((await app.event(order)).status, 200);
    assert.equal(app.notifications.length, 1); assert.equal(order.payment_status, 'paid');
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
  assert.equal(app.notifications.length, 0);
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

function telegramTest(t) {
  const saved = { fetch: global.fetch, token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID, error: console.error, warn: console.warn };
  const calls = [], logs = [];
  process.env.TELEGRAM_BOT_TOKEN = 'test-token-do-not-log';
  process.env.TELEGRAM_CHAT_ID = 'test-chat';
  console.error = (...args) => logs.push(args.join(' '));
  console.warn = (...args) => logs.push(args.join(' '));
  global.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => ({ ok: true }) }; };
  t.after(() => {
    global.fetch = saved.fetch; console.error = saved.error; console.warn = saved.warn;
    for (const [key, value] of [['TELEGRAM_BOT_TOKEN', saved.token], ['TELEGRAM_CHAT_ID', saved.chat]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  return { calls, logs, notify: runtime({ 'server-only': {} }).load('lib/telegram.ts').notifyPaidOrder };
}

test('Telegram sends one plain-text message with all paid order details and stored commission', async t => {
  const telegram = telegramTest(t), app = setup(telegram.notify), key = randomUUID();
  await app.submit(key, { roomNumber: '123', specialInstructions: '<Reception> & door code 1234', items: [
    { kind: 'kit', id: 'power-kit', quantity: 1, cableType: 'lightning-cable' },
    { kind: 'product', id: 'bag', quantity: 2 },
  ] });
  const order = app.orders.get(key);
  assert.equal((await app.event(order)).status, 200);
  assert.equal(telegram.calls.length, 1);
  const { url, options } = telegram.calls[0];
  assert.equal(url, 'https://api.telegram.org/bottest-token-do-not-log/sendMessage');
  assert.equal(options.method, 'POST'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error');
  assert(options.signal instanceof AbortSignal);
  const body = JSON.parse(options.body);
  assert.equal(body.chat_id, 'test-chat'); assert.equal(body.parse_mode, undefined);
  assert.deepEqual(body.link_preview_options, { is_disabled: true });
  for (const text of ['🟢 NEW PAID ORDER', `Order: ${order.order_number}`, 'Customer: Test Guest', 'Phone: 12345678', 'Room: 123',
    'Hotel/Destination:\nTest Hotel', 'Delivery:\nHotel Delivery', '- Power Kit × 1 (Lightning)', '- Small Crossbody Bag × 2',
    `Subtotal: €${(order.subtotal / 100).toFixed(2)}`, `Delivery: €${(order.delivery_fee / 100).toFixed(2)}`, `Total: €${(order.total / 100).toFixed(2)}`,
    'Referral:\nhotel01', `Hotel commission:\n€${(order.hotel_commission / 100).toFixed(2)}`, 'Special instructions:\n<Reception> & door code 1234']) assert(body.text.includes(text), text);
  assert.equal((await app.event(order)).status, 200);
  assert.equal(telegram.calls.length, 1);
});

test('Telegram falls back to direct destination, displays USB-C and handles missing optional fields', async t => {
  const telegram = telegramTest(t), app = setup(telegram.notify), key = randomUUID();
  await app.submit(key, { refCode: null, items: [{ kind: 'kit', id: 'essential-kit', quantity: 1, cableType: 'usb-c-cable' }] });
  assert.equal((await app.event(app.orders.get(key))).status, 200);
  const { text } = JSON.parse(telegram.calls[0].options.body);
  for (const value of ['Room: —', 'Hotel/Destination:\nHotel address', '(USB-C)', 'Referral:\nDirect', 'Hotel commission:\n€0.00', 'Special instructions:\n—']) assert(text.includes(value), value);
});

test('Telegram HTTP/API/JSON/network/timeout errors never fail a paid webhook or expose raw errors', async t => {
  const telegram = telegramTest(t);
  const outcomes = [
    async () => ({ ok: false, status: 403 }),
    async () => ({ ok: true, json: async () => ({ ok: false, description: 'test-token-do-not-log' }) }),
    async () => ({ ok: true, json: async () => { throw Error('test-token-do-not-log'); } }),
    async () => { throw Error('https://api.telegram.org/bottest-token-do-not-log/sendMessage'); },
    async () => { throw new DOMException('test-token-do-not-log', 'TimeoutError'); },
  ];
  for (const outcome of outcomes) {
    let count = 0;
    global.fetch = async () => { count++; return outcome(); };
    const app = setup(telegram.notify), key = randomUUID(); await app.submit(key);
    const order = app.orders.get(key);
    assert.equal((await app.event(order)).status, 200); assert.equal(order.payment_status, 'paid');
    assert.equal((await app.event(order)).status, 200); assert.equal(count, 1);
  }
  assert.equal(telegram.logs.length, outcomes.length);
  assert(telegram.logs.every(line => line.startsWith('[telegram]') && !line.includes('test-token-do-not-log')));
});

test('missing Telegram configuration skips sending without failing payment', async t => {
  const telegram = telegramTest(t);
  for (const missing of ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID']) {
    const previous = process.env[missing]; delete process.env[missing];
    const app = setup(telegram.notify), key = randomUUID(); await app.submit(key);
    assert.equal((await app.event(app.orders.get(key))).status, 200);
    assert.equal(app.orders.get(key).payment_status, 'paid');
    process.env[missing] = previous;
  }
  assert.equal(telegram.calls.length, 0);
  assert.deepEqual(telegram.logs, ['[telegram] not_configured', '[telegram] not_configured']);
});

test('unusually long legacy order messages stay within Telegram limit with a visible truncation notice', async t => {
  const telegram = telegramTest(t), app = setup(telegram.notify), key = randomUUID();
  await app.submit(key); const order = app.orders.get(key);
  order.special_instructions = 'x'.repeat(5000);
  assert.equal((await app.event(order)).status, 200);
  const { text } = JSON.parse(telegram.calls[0].options.body);
  assert(text.length <= 4096); assert(text.endsWith('[Truncated — see admin for full order.]'));
});
