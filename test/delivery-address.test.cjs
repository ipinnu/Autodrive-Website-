const { test } = require('node:test');
const assert = require('node:assert/strict'); const fs = require('node:fs'); const vm = require('node:vm');
const ts = require('typescript'); const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
function compile(path) { return ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText; }
const component = {};
vm.runInNewContext(compile('src/components/DeliveryAddressPicker.tsx'), { exports: component, require: (name) => {
  if (name === '@/lib/customer-checkout') return { searchAddresses: async () => [] };
  if (name === '@/lib/customer') return { track: () => {}, errorMessage: String };
  return require(name);
} });
const props = { addresses: [], address: null, confirmed: false, disabled: false, onSelect: () => {}, onConfirm: () => {} };
test('manual address fields start collapsed', () => {
  const html = renderToStaticMarkup(React.createElement(component.default, props));
  assert.match(html, /Enter address manually/); assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /Street \/ house number/); assert.doesNotMatch(html, /autoComplete="street-address"/);
});
test('a saved address displays as a summary without opening manual fields', () => {
  const address = { addressId: 'home', addressLine: '1 Allen Avenue', city: 'Ikeja', state: 'Lagos', postcode: '', formatted: '1 Allen Avenue, Ikeja, Lagos' };
  const html = renderToStaticMarkup(React.createElement(component.default, { ...props, addresses: [address], address }));
  assert.match(html, /Deliver to/); assert.match(html, /1 Allen Avenue, Ikeja, Lagos/);
  assert.match(html, /Change address/); assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(html, /role="combobox"/);
  assert.doesNotMatch(html, /autoComplete="street-address"/);
});
test('live address search sends the authenticated query and caches selectable results', async () => {
  let request; let calls = 0; const service = {};
  vm.runInNewContext(compile('src/lib/customer-checkout.ts'), { exports: service, AbortSignal,
    fetch: async (url, options) => { calls++; request = { url, options }; return { ok: true, json: async () => [{ name: 'Allen Avenue', display_name: 'Allen Avenue, Ikeja, Lagos, Nigeria', lat: '6.60', lon: '3.35', address: { road: 'Allen Avenue', city: 'Ikeja', state: 'Lagos' } }] }; },
    require: (name) => name === './customer' ? { client: () => ({ auth: { currentUser: { getIdToken: async () => 'test-token' } } }) } : {},
  });
  const result = await service.searchAddresses('  Allen Avenue   Ikeja  ');
  assert.equal(request.url, '/api/addresses/search?q=Allen%20Avenue%20Ikeja');
  assert.equal(request.options.headers.Authorization, 'Bearer test-token');
  assert.equal(result[0].addressLine, 'Allen Avenue'); assert.equal(result[0].city, 'Ikeja'); assert.equal(result[0].state, 'Lagos');
  assert.equal(result[0].latitude, 6.6); assert.equal(result[0].longitude, 3.35);
  await service.searchAddresses('Allen Avenue Ikeja'); assert.equal(calls, 1);
});
test('the first address entry uses a live combobox without a submit-search step', () => {
  const html = renderToStaticMarkup(React.createElement(component.default, props));
  assert.match(html, /role="combobox"/); assert.match(html, /aria-autocomplete="list"/);
  assert.doesNotMatch(html, />Search address</);
});
test('Photon results keep Nigerian addresses, coordinates and deduplicate identical suggestions', () => {
  const provider = {};
  vm.runInNewContext(compile('src/lib/photon-address.ts'), { exports: provider });
  const feature = { geometry: { coordinates: [3.35, 6.6] }, properties: { name: 'Allen Avenue', type: 'street', city: 'Ikeja', state: 'Lagos', countrycode: 'NG' } };
  const results = provider.photonAddresses({ features: [feature, feature, { ...feature, properties: { ...feature.properties, countrycode: 'DE' } }] });
  assert.equal(results.length, 1); assert.equal(results[0].address.road, 'Allen Avenue'); assert.equal(results[0].address.city, 'Ikeja');
  assert.equal(results[0].lat, '6.6'); assert.equal(results[0].lon, '3.35');
});
test('reusing an unchanged primary address avoids rewriting the address book', async () => {
  const service = {}; let batches = 0;
  const saved = { addressId: 'home', addressLine: '1 Allen Avenue', city: 'Ikeja', state: 'Lagos', postcode: '', formatted: '1 Allen Avenue, Ikeja, Lagos', isPrimary: true };
  vm.runInNewContext(compile('src/lib/customer-checkout.ts'), { exports: service, require: (name) => {
    if (name === './customer') return { client: () => ({ auth: { currentUser: { uid: 'buyer' } }, db: {} }) };
    return { collection: () => ({}), getDocs: async () => ({ docs: [{ id: 'home', data: () => saved }] }), writeBatch: () => { batches++; throw new Error('Unexpected write'); } };
  } });
  const result = await service.saveAddress(saved); assert.equal(result.addressId, 'home'); assert.equal(batches, 0);
});
