const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');

function load(file, mocks) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), mod, mod.exports);
  return mod.exports;
}

test('real React Server Component serialization accepts home with absent, valid, unknown, and repeated refs', () => {
  // Run React's server export condition in an isolated process, without starting a web server.
  const output = execFileSync(process.execPath, ['--conditions=react-server', '-e', `
    const fs = require('node:fs'), ts = require('typescript'), React = require('react');
    const { PassThrough } = require('node:stream');
    const { registerClientReference, renderToPipeableStream } = require('next/dist/compiled/react-server-dom-webpack/server.node');
    const references = {}, manifest = {};
    const mod = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('app/page.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
      if (!name.startsWith('@/components/')) return require(name);
      const exports = {};
      for (const component of ['Header', 'Hero', 'Kits', 'Builder', 'Footer', 'ReferralCapture']) {
        const id = name + '#' + component;
        exports[component] = registerClientReference(function() {}, name, component);
        manifest[id] = { id, chunks: [], name: component };
        if (component === 'ReferralCapture') references.referral = exports[component];
      }
      return exports;
    }, mod, mod.exports);
    function serialize(element) {
      return new Promise((resolve, reject) => {
        const errors = [], chunks = [], sink = new PassThrough();
        sink.on('data', chunk => chunks.push(chunk));
        sink.on('error', reject);
        sink.on('end', () => resolve({ errors, wire: Buffer.concat(chunks).toString() }));
        renderToPipeableStream(element, manifest, { onError(error) { errors.push(error.message); return 'test-error'; } }).pipe(sink);
      });
    }
    (async () => {
      const results = [];
      for (const ref of [undefined, 'hotel01', 'unknown', ['hotel01', 'unknown'], '']) {
        results.push({ ref, ...await serialize(await mod.exports.default({ searchParams: Promise.resolve({ ref }) })) });
      }
      const originalError = await serialize(React.createElement(references.referral, { ref: 'hotel01' }));
      console.log(JSON.stringify({ results, originalErrors: originalError.errors }));
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `], { cwd: root, encoding: 'utf8' });
  const { results, originalErrors } = JSON.parse(output);
  assert.deepEqual(originalErrors, ['Refs cannot be used in Server Components, nor passed to Client Components.']);
  for (const result of results) {
    assert.deepEqual(result.errors, []);
    if (result.ref) assert(result.wire.includes(`"referralCode":"${Array.isArray(result.ref) ? result.ref[0] : result.ref}"`));
  }
});

test('unknown/inactive hotel refs return 404 and the client hides failed lookups', async t => {
  const calls = [];
  const chain = {
    select(value) { calls.push(['select', value]); return this; },
    eq(...args) { calls.push(['eq', ...args]); return this; },
    async maybeSingle() { return { data: null, error: null }; },
  };
  const hotels = load('lib/hotels.ts', { '@/lib/supabase': { supabaseAdmin: { from: () => chain } } });
  const { GET } = load('app/api/hotels/[ref]/route.ts', { '@/lib/hotels': hotels });
  assert.equal((await GET(null, { params: Promise.resolve({ ref: 'unknown' }) })).status, 404);
  assert(calls.some(call => call[0] === 'eq' && call[1] === 'active' && call[2] === true));
  chain.maybeSingle = async () => ({ data: { name: 'Test Hotel', ref_code: 'hotel01', active: true }, error: null });
  const valid = await GET(null, { params: Promise.resolve({ ref: 'hotel01' }) });
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).refCode, 'hotel01');

  const previousFetch = global.fetch;
  t.after(() => { global.fetch = previousFetch; });
  for (const response of [async () => ({ ok: false }), async () => { throw new Error('Network unavailable'); }]) {
    const effects = [], updates = [];
    global.fetch = response;
    const { ReferralCapture } = load('components/referral-capture.tsx', {
      react: { ...React, useEffect: effect => effects.push(effect), useState: () => [null, value => updates.push(value)] },
      '@/components/cart-provider': { useCart: () => ({ refCode: 'unknown', setRefCode() {} }) },
    });
    assert.equal(ReferralCapture({ referralCode: 'unknown' }), null);
    effects.forEach(effect => effect());
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(updates, [null]);
  }
});

test('URL referrals survive saved-cart restoration and are persisted without changing cart items', t => {
  const previousStorage = global.sessionStorage;
  t.after(() => { if (previousStorage === undefined) delete global.sessionStorage; else global.sessionStorage = previousStorage; });
  const items = [{ kind: 'product', id: 'bag', quantity: 2 }];
  const catalog = load('data/catalog.ts', {});
  for (const savedRef of [null, 'previous-hotel']) {
    const state = [], effects = []; let cursor = 0; let persisted;
    global.sessionStorage = {
      getItem: () => JSON.stringify({ items, deliveryType: 'hotel', refCode: savedRef }),
      setItem: (_, value) => { persisted = JSON.parse(value); },
    };
    const { CartProvider } = load('components/cart-provider.tsx', {
      '@/data/catalog': catalog,
      react: {
        ...React,
        useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
        useEffect: effect => effects.push(effect), useMemo: fn => fn(), useRef: () => ({ current: null }),
      },
    });
    let provider = CartProvider({ children: null });
    // Child referral effects may run before the parent restores sessionStorage.
    const referralEffects = [];
    const { ReferralCapture } = load('components/referral-capture.tsx', {
      react: { ...React, useEffect: effect => referralEffects.push(effect), useState: () => [null, () => {}] },
      '@/components/cart-provider': { useCart: () => provider.props.value },
    });
    ReferralCapture({ referralCode: 'hotel01' });
    referralEffects[0]();
    effects.forEach(effect => effect());
    cursor = 0; effects.length = 0;
    provider = CartProvider({ children: null });
    assert.equal(provider.props.value.refCode, 'hotel01');
    assert.deepEqual(provider.props.value.items, items);
    effects.at(-1)();
    assert.equal(persisted.refCode, 'hotel01');
    assert.deepEqual(persisted.items, items);
  }
});
