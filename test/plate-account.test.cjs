const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const { outputText } = ts.transpileModule(readFileSync('src/app/renew/from-plate/page.tsx', 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function mount({ valid = true, accepts = true, draft = true, existing } = {}) {
  const events = [];
  const states = [], refs = [];
  let stateIndex = 0, refIndex = 0, form, initialized = false;
  const saved = { email: 'customer@example.test', plateDraft: { plate: 'ABC123DE', fullName: 'Test Customer', intent: 'renew' } };
  const auth = { currentUser: { uid: 'previous-user' }, authStateReady: async () => {} };
  const user = { uid: 'verified-user', email: saved.email, emailVerified: true };
  const exports = {};
  const element = (tag, props) => { if (tag === 'form') form = props; };
  runInNewContext(outputText, {
    exports, URLSearchParams,
    window: { history: { replaceState() {} }, location: { href: 'https://example.test/renew/from-plate', search: '?draft=abc', replace: (url) => events.push(url) } },
    require: (name) => ({
      react: {
        useEffect: (effect) => { if (!initialized) { initialized = true; effect(); } },
        useState: (initial) => {
          const i = stateIndex++;
          if (!(i in states)) states[i] = initial;
          return [states[i], (v) => { states[i] = v; }];
        },
        useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      },
      'react/jsx-runtime': { jsx: element, jsxs: element },
      'firebase/auth': {
        isSignInWithEmailLink: () => valid,
        signOut: async () => { events.push('sign out'); auth.currentUser = null; },
        setPersistence: async () => {},
        signInWithEmailLink: async (_auth, email) => {
          events.push('verify link');
          if (!accepts || email !== saved.email) throw Object.assign(new Error('Used link'), { code: 'auth/invalid-action-code' });
          auth.currentUser = user;
          return { user };
        },
      },
      'firebase/firestore': {
        doc: (_db, collection, uid) => collection + '/' + uid,
        runTransaction: (_db, callback) => callback({
          get: async () => ({ exists: () => Boolean(existing), data: () => existing }),
          set: (ref) => events.push(ref),
        }),
      },
      'next/link': {},
      '@/lib/customer': {
        client: () => ({ auth, db: {} }), errorMessage: (e) => e.message,
        registrationAgent: async () => 'agent', registrationData: () => ({ role: 'buyer' }), track: async () => {},
      },
      '@/lib/email-link': {
        readEmailDraft: () => draft ? saved : undefined, clearEmailDraft() {}, clearVerifiedPlate() {},
        rememberVerifiedPlate: (uid) => { events.push('remember ' + uid); return true; },
        requestEmailLink: async () => { events.push('send link'); },
      },
    })[name],
  });
  function render() { stateIndex = 0; refIndex = 0; exports.default(); }
  render();
  return { events, async submit(email) {
    if (email) states[0] = email;
    render();
    form.onSubmit({ preventDefault() {} });
    await new Promise(setImmediate);
  } };
}

test('a saved session cannot open an account before Firebase verifies the link', async () => {
  const { events, submit } = mount();
  assert.deepEqual(events, []);
  await submit();
  assert.deepEqual(events, ['sign out', 'verify link', 'users/verified-user', 'remember verified-user', '/renew/onboarding']);
});
test('an expired or used link cannot create a profile or reveal an account', async () => {
  const { events, submit } = mount({ accepts: false });
  await submit();
  assert.deepEqual(events, ['sign out', 'verify link']);
});
test('a returning customer keeps their profile and resumes adding the checked car', async () => {
  const { events, submit } = mount({ existing: { role: 'buyer', buyerOnboardingCompleted: true } });
  await submit();
  assert.deepEqual(events, ['sign out', 'verify link', 'remember verified-user', '/renew/add-vehicle']);
});
test('another browser requires the email and opens ordinary onboarding without a draft', async () => {
  const { events, submit } = mount({ draft: false });
  await submit('customer@example.test');
  assert.deepEqual(events, ['sign out', 'verify link', '/renew']);
});
test('a bare callback URL just offers an email link', async () => {
  const { events, submit } = mount({ valid: false, draft: false });
  await submit('customer@example.test');
  assert.deepEqual(events, ['send link']);
});
