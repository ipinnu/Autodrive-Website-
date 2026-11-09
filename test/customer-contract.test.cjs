const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const source = ts.transpileModule(fs.readFileSync('src/lib/customer.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let writes, commits, currentUser;
const ref = (...args) => ({ path: args.filter((v) => typeof v === 'string' || v?.path).map((v) => typeof v === 'string' ? v : v.path).join('/') });
const firestore = {
  collection: ref, doc: (...args) => args.length === 1 ? { path: args[0].path + '/car-test', id: 'car-test' } : ref(...args),
  serverTimestamp: () => 'SERVER_TIMESTAMP', increment: (n) => n,
  addDoc: async () => {}, setDoc: async () => {}, getDocs: async () => ({ docs: [] }),
  writeBatch: () => ({ set: (r, value, options) => writes.push({ path: r.path, value, options }),
    update: (r, value) => writes.push({ path: r.path, value }), commit: async () => { commits++; } }),
};
const exportsObject = {};
vm.runInNewContext(source, { exports: exportsObject, require: (name) => {
  if (name === 'firebase/firestore') return firestore;
  if (name === './firebase') return { getFirebaseClient: () => ({ db: {}, auth: { currentUser } }) };
  throw new Error(name);
}, crypto: webcrypto, TextEncoder, Date, btoa, Uint8Array });
const service = exportsObject;
beforeEach(() => { writes = []; commits = 0; currentUser = { uid: 'buyer-test', emailVerified: true }; });
test('signup preserves the app contact and assignment fields under uid', () => {
  const result = service.registrationData({ uid: 'buyer-test', fullName: 'Ada Okafor', email: 'ada@example.invalid', phone: '08012345678', agentId: 'assigned-agent', accountType: 'organization' });
  for (const [key, value] of Object.entries({ uid: 'buyer-test', firstName: 'Ada', lastName: 'Okafor', fullName: 'Ada Okafor', email: 'ada@example.invalid', phone: '08012345678', phoneNumber: '08012345678', agentId: 'assigned-agent', role: 'buyer', accountType: 'organization', buyerOnboardingCompleted: false })) assert.equal(result[key], value);
});
test('invalid contacts and mismatched passwords fail before signup', () => {
  assert.throws(() => service.validateDetails('Ada Okafor', '123', 'TestOnly123!', 'TestOnly123!'), /phone/);
  assert.throws(() => service.validateDetails('Ada Okafor', '08012345678', 'TestOnly123!', 'different'), /match/);
  service.validateDetails('Ada Okafor', '08012345678', 'TestOnly123!', 'TestOnly123!');
});
test('signup accepts no phone without inventing contact fields', () => {
  service.validateDetails('Ada Okafor', undefined, 'TestOnly123!', 'TestOnly123!');
  const result = service.registrationData({ uid: 'buyer-test', fullName: 'Ada Okafor', email: 'ada@example.invalid', agentId: 'assigned-agent', accountType: 'personal' });
  assert.equal(Object.hasOwn(result, 'phone'), false);
  assert.equal(Object.hasOwn(result, 'phoneNumber'), false);
});
const vehicle = { make: 'Toyota', model: 'Corolla', year: 2020, type: 'Salon', plate: 'ABC-123-DE', state: 'Lagos', documents: ['Vehicle License'], expiries: { 'Vehicle License': '2027-06-01' }, onboarding: true };
test('unverified customers cannot bypass the gate through vehicle saves', async () => {
  currentUser.emailVerified = false;
  await assert.rejects(service.saveVehicle(vehicle), /Verify/);
  assert.equal(commits, 0);
});
test('vehicle, canonical expiry, reminder invalidations and onboarding commit together', async () => {
  await service.saveVehicle(vehicle);
  assert.equal(commits, 1);
  const car = writes.find((w) => w.path === 'cars/buyer-test/carDetails/car-test');
  assert.equal(car.value.registration.plateNumber, 'ABC123DE');
  const path = 'cars/buyer-test/carDetails/car-test/documents/Vehicle License';
  assert.equal(writes.find((w) => w.path === path).value.expiration, '2027-06-01');
  for (const kind of ['before', 'after']) {
    const schedule = writes.find((w) => w.path === 'notification_history/' + service.scheduleId(path, kind));
    assert.equal(schedule.value.documentPath, path);
    assert.equal(schedule.value.scheduleState, 'dirty'); assert.equal(schedule.value.dueAt, 0);
  }
  assert.equal(writes.find((w) => w.path === 'users/buyer-test').value.buyerOnboardingCompleted, true);
});
test('expiry edits update the existing document and the same two schedule identities', async () => {
  await service.saveExpiry('car-test', 'Vehicle License', '2028-06-01');
  assert.equal(commits, 1); assert.equal(writes.length, 3);
  assert.equal(writes[0].value.expiration, '2028-06-01');
  assert.equal(writes[1].value.documentPath, writes[0].path);
  assert.equal(writes[2].value.documentPath, writes[0].path);
});
test('impossible expiry date never commits', async () => {
  await assert.rejects(service.saveExpiry('car-test', 'Vehicle License', '2027-02-30'), /expiry date/);
  assert.equal(commits, 0);
});
test('expiry views recognize the same legacy strings and timestamps as the app', () => {
  for (const value of ['2027-06-01', '2027-06-01T00:00:00Z', '01/06/2027', '01-06-2027', 'Jun 1, 2027', '1 Jun 2027', { toDate: () => new Date('2027-05-31T23:00:00Z') }]) {
    assert.equal(service.normalizeExpiry(value), '2027-06-01');
  }
  for (const value of ['Not Set', '', '2027-02-30', null]) assert.equal(service.normalizeExpiry(value), 'Not Set');
});
