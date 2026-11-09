const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
const memory = new Map(); const service = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/renewal-draft.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: service, Date, sessionStorage: { getItem: (k) => memory.get(k), setItem: (k, v) => memory.set(k, v) } });
const selection = [{ carId: 'car-1', documentId: 'Vehicle License' }];
beforeEach(() => memory.clear());
test('back navigation restores selections and the same unexpired quote for this buyer only', () => {
  const quote = { quoteToken: 'signed-quote', amount: 7900, logisticsFeeNGN: 2900, expiresAt: Date.now() + 60000, selectedDocuments: selection };
  service.saveRenewalDraft('buyer-1', selection, quote);
  assert.equal(service.readRenewalDraft('buyer-1').quote.quoteToken, 'signed-quote');
  assert.equal(service.readRenewalDraft('buyer-1').selection[0].carId, 'car-1');
  assert.equal(service.readRenewalDraft('buyer-2').selection.length, 0);
});
test('changed selections discard the old quote; expired quotes preserve selection only', () => {
  service.saveRenewalDraft('buyer-1', selection, { expiresAt: Date.now() - 1, selectedDocuments: selection });
  assert.equal(service.readRenewalDraft('buyer-1').quote, undefined);
  assert.equal(service.readRenewalDraft('buyer-1').selection.length, 1);
  service.saveRenewalDraft('buyer-1', selection, { expiresAt: Date.now() + 60000, selectedDocuments: [] });
  assert.equal(service.readRenewalDraft('buyer-1').quote, undefined);
});
test('malformed local data cannot crash the renewal page', () => {
  memory.set('autodrive-renewal-draft-buyer-1', '{broken');
  assert.equal(service.readRenewalDraft('buyer-1').selection.length, 0);
});
