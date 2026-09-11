const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

function runtime(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(root, file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} }; cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020,
    } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) {
        const base = name.slice(2);
        return load([`${base}.ts`, `${base}.tsx`].find(p => fs.existsSync(path.join(root, p))));
      }
      return require(name);
    }, mod, mod.exports);
    return mod.exports;
  }
  return { load };
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(nodes);
  return [node, ...nodes(node.props?.children)];
}
const base = runtime();
const locales = { en: base.load('locales/en.ts').default, de: base.load('locales/de.ts').default };
const ids = ['essential-kit', 'power-kit', 'full-day-kit'];
const kit = (id, cableType) => ({ kind: 'kit', id, quantity: 1, cableType });
const product = { kind: 'product', id: 'bag', quantity: 2 };

function ui(lang = 'en', items = [kit('power-kit')], overrides = {}) {
  const cart = {
    items, cartOpen: true, subtotal: 3490, deliveryFee: 490, total: 3980, deliveryType: 'hotel', refCode: 'hotel01',
    setKitCable(id, cableType) { this.items = this.items.map(item => item.kind === 'kit' && item.id === id ? { ...item, cableType } : item); },
    setCartOpen() {}, remove() {}, setQuantity() {}, showToast() {}, addKit() {},
  };
  // Match the provider's stable callback behavior when a component destructures it.
  cart.setKitCable = cart.setKitCable.bind(cart);
  const t = key => {
    const value = key.split('.').reduce((obj, key) => obj?.[key], locales[lang]);
    assert.equal(typeof value, 'string', `Missing ${lang} translation: ${key}`);
    return value;
  };
  return { cart, t, ...runtime({
    '@/components/cart-provider': { useCart: () => cart },
    '@/components/i18n-provider': { useI18n: () => ({ t, lang }) },
    ...overrides,
  }) };
}
const hookStubs = { ...React, useState: initial => [initial, () => {}], useEffect() {}, useId: () => 'cable-test' };

test('every kit requires an explicit valid cable; individual products do not', () => {
  const { needsKitCable } = base.load('lib/kit-cable.ts');
  const { calculateOrder } = base.load('lib/order.ts');
  for (const id of ids) {
    for (const choice of [undefined, '', null, 'invalid']) {
      assert.equal(needsKitCable(kit(id, choice)), true);
      assert.throws(() => calculateOrder([kit(id, choice)], 'hotel'), /Choose a cable type/);
    }
    const usb = calculateOrder([kit(id, 'usb-c-cable')], 'hotel');
    const lightning = calculateOrder([kit(id, 'lightning-cable')], 'hotel');
    assert.equal(usb.total, lightning.total);
    assert.equal(lightning.items[0].cableType, 'lightning-cable');
    assert.equal(needsKitCable(lightning.items[0]), false);
  }
  assert.equal(needsKitCable(product), false);
  assert.doesNotThrow(() => calculateOrder([product], 'hotel'));
});

test('EN/DE cart identifies missing kit and both checkout entry points use the same gate', () => {
  for (const lang of ['en', 'de']) {
    const env = ui(lang);
    const Cart = env.load('components/cart-drawer.tsx').CartDrawer;
    let html = renderToStaticMarkup(React.createElement(Cart));
    assert(html.includes(env.t('cart.cableRequired')));
    assert(html.includes(env.t('kits.cableLabel').replace('{kit}', env.t('kits.names.power-kit'))));
    assert(html.includes('disabled=""'));
    assert(!html.includes('href="/checkout"'));
    env.cart.setKitCable('power-kit', 'lightning-cable');
    html = renderToStaticMarkup(React.createElement(Cart));
    assert(!html.includes(env.t('cart.cableRequired')));
    assert(html.includes('href="/checkout"'));
    assert(html.includes('aria-pressed="true"'));
  }
  for (const file of ['components/builder.tsx', 'components/cart-drawer.tsx']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert(source.includes('<CheckoutLink'));
    assert(!source.includes('href="/checkout"'));
  }
});

test('cart cable selector stores only the explicit choice and retains separate items', () => {
  const env = ui('de', [kit('essential-kit'), product], { react: hookStubs });
  const Selector = env.load('components/kit-cable-selector.tsx').KitCableSelector;
  let tree = Selector({ item: env.cart.items[0] });
  const buttons = nodes(tree).filter(n => n.type === 'button');
  assert(buttons.every(n => n.props.type === 'button' && n.props['aria-pressed'] === false));
  buttons[1].props.onClick();
  assert.equal(env.cart.items[0].cableType, 'lightning-cable');
  assert.deepEqual(env.cart.items[1], product);
  tree = Selector({ item: env.cart.items[0] });
  assert(nodes(tree).find(n => n.type === 'button' && n.props.children === 'Lightning').props['aria-pressed']);
});

test('kit cards never start with a cable default or show cached choice as a missing cart choice', () => {
  const env = ui('en', [], { react: hookStubs, '@/components/product-image': { ProductImage: () => null } });
  const Kits = env.load('components/kits.tsx').Kits;
  const tree = Kits();
  const cableButtons = nodes(tree).filter(n => n.type === 'button' && ['USB-C', 'Lightning'].includes(n.props.children));
  assert.equal(cableButtons.length, 6);
  assert(cableButtons.every(n => n.props['aria-pressed'] === false));
});

test('checkout guards submission, resolves choice in place, and keeps entered details in the payload', async t => {
  const saved = { fetch: global.fetch, FormData: global.FormData, window: global.window };
  t.after(() => { Object.assign(global, saved); });
  const details = { customerName: 'Test Guest', roomNumber: '123', phone: '12345678', destination: 'Test Hotel', specialInstructions: 'Reception please' };
  global.FormData = class { constructor(form) { this.values = form; } get(key) { return this.values[key]; } };
  const payloads = [];
  global.fetch = async (url, options) => { payloads.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ url: 'https://example.invalid/test-checkout' }) }; };
  global.window = { location: { assign() {} } };
  const env = ui('de', [kit('full-day-kit'), product], { react: hookStubs });
  const Checkout = env.load('components/checkout-form.tsx').CheckoutForm;
  const Selector = env.load('components/kit-cable-selector.tsx').KitCableSelector;
  let form = Checkout();
  const fields = tree => nodes(tree).filter(n => ['input', 'textarea'].includes(n.type)).map(n => ({ type: n.type, name: n.props.name, key: n.key, defaultValue: n.props.defaultValue, value: n.props.value }));
  const before = fields(form);
  assert(nodes(form).find(n => n.type === 'button' && n.props['aria-describedby'] === 'checkout-cable-error').props.disabled);
  await form.props.onSubmit({ preventDefault() {}, currentTarget: details });
  assert.equal(payloads.length, 0);
  const cable = nodes(form).find(n => n.type === Selector);
  assert(cable);
  nodes(Selector(cable.props)).find(n => n.type === 'button' && n.props.children === 'Lightning').props.onClick();
  form = Checkout();
  assert.deepEqual(fields(form), before); // Customer fields keep their type/key/name and remain uncontrolled.
  assert(!nodes(form).find(n => n.type === 'button' && n.props.className.includes('button-primary')).props.disabled);
  await form.props.onSubmit({ preventDefault() {}, currentTarget: details });
  assert.equal(payloads.length, 1);
  for (const [key, value] of Object.entries(details)) assert.equal(payloads[0][key], value);
  assert.equal(payloads[0].items[0].cableType, 'lightning-cable');
  assert.deepEqual(payloads[0].items[1], product);
  assert.equal(payloads[0].refCode, 'hotel01');
  assert.equal(payloads[0].deliveryType, 'hotel');
  assert.equal(payloads[0].locale, 'de');
});

test('checkout API rejects missing/invalid cables before storage or Stripe; valid choice is saved', async () => {
  const writes = [], sessions = [];
  const env = runtime({
    '@/lib/supabase': { supabaseAdmin: { from: () => ({
      insert(value) { writes.push(value); return { select: () => ({ single: async () => ({ data: { id: 'test-order' }, error: null }) }) }; },
      update: () => ({ eq: async () => ({ error: null }) }),
    }) } },
    '@/lib/stripe': { stripe: { checkout: { sessions: { create: async value => { sessions.push(value); return { id: 'test-session', url: 'https://example.invalid/checkout' }; } } } } },
    '@/lib/hotels': { getHotelByRef: async () => null, normalizeRef: () => null },
  });
  const { POST } = env.load('app/api/checkout/route.ts');
  const submit = (id, cableType) => POST(new Request('http://localhost/api/checkout', { method: 'POST', body: JSON.stringify({ items: [kit(id, cableType)], deliveryType: 'hotel', customerName: 'Test Guest', phone: '12345678', destination: 'Test Hotel' }) }));
  for (const id of ids) for (const choice of [undefined, 'invalid']) assert.equal((await submit(id, choice)).status, 400);
  assert.equal(writes.length, 0);
  assert.equal(sessions.length, 0);
  for (const id of ids) for (const choice of ['usb-c-cable', 'lightning-cable']) {
    assert.equal((await submit(id, choice)).status, 200);
    assert.equal(writes.at(-1).items[0].cableType, choice);
    assert.equal(writes.at(-1).items[0].id, id);
    assert.equal(sessions.at(-1).line_items[0].price_data.unit_amount, writes.at(-1).subtotal);
  }
});
