const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');
const ts = createRequire(resolve('package.json'))('typescript');
const { outputText } = ts.transpileModule(readFileSync('src/app/renew/from-plate/page.tsx', 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
});

function mount({ savedUser, rejectSignOut, search = '' }) {
  const events = [];
  let finishAuthRestore;
  const auth = {
    currentUser: null,
    authStateReady: () => new Promise((resolveRestore) => {
      finishAuthRestore = () => { auth.currentUser = savedUser ? { uid: 'synthetic-user' } : null; resolveRestore(); };
    }),
  };
  const exports = {};
  runInNewContext(outputText, {
    exports,
    URLSearchParams,
    window: { location: { search, replace: (path) => events.push(path) } },
    require: (name) => ({
      react: { useEffect: (effect) => effect(), useState: () => [false, () => events.push('error')] },
      'react/jsx-runtime': { jsxs: () => {}, jsx: () => {} },
      'firebase/auth': { signOut: async () => {
        events.push('sign out');
        if (rejectSignOut) throw new Error('Sign-out unavailable');
        auth.currentUser = null;
      } },
      'next/link': {},
      '@/lib/firebase': { getFirebaseClient: () => ({ auth }) },
    })[name],
  });
  exports.default();
  return { events, finishAuthRestore };
}

for (const regression of [
  { name: 'stored login waits for restoration and signs out first', savedUser: true, expected: ['sign out', '/renew/sign-up'] },
  { name: 'fresh guest gets signup', savedUser: false, expected: ['/renew/sign-up'] },
  { name: 'renewal entry clears the session and keeps the welcome destination', savedUser: true, search: '?intent=renew', expected: ['sign out', '/renew/welcome'] },
  { name: 'failed sign-out blocks entry to the account flow', savedUser: true, rejectSignOut: true, expected: ['sign out', 'error'] },
]) test(regression.name, async () => {
  const { events, finishAuthRestore } = mount(regression);
  assert.deepEqual(events, []);
  finishAuthRestore();
  await new Promise(setImmediate);
  assert.deepEqual(events, regression.expected);
});
