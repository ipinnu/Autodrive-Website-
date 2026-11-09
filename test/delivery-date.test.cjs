const { test } = require('node:test'); const assert = require('node:assert/strict');
const fs = require('node:fs'); const vm = require('node:vm'); const ts = require('typescript');
const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
const service = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/DeliveryDatePicker.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports: service, Date, Intl, require: (name) => {
  if (name === '@/lib/customer') return { track: () => {} };
  if (name === '@daypicker/react') return { DayPicker: () => null };
  return require(name);
} });
test('calendar selection preserves the same date across browser timezones', () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ['Africa/Lagos', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env.TZ = timezone;
      for (const value of ['2026-11-04', '2026-12-31', '2027-01-01', '2028-02-29']) assert.equal(service.calendarValue(service.calendarDate(value)), value);
    }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
});
test('delivery date displays as a styled control without a native date input', () => {
  const html = renderToStaticMarkup(React.createElement(service.default, { value: '2026-11-04', min: '2026-11-04', max: '2027-02-02', onChange: () => {} }));
  assert.match(html, /Preferred delivery date/); assert.match(html, /4 November 2026/); assert.match(html, /Earliest available delivery/);
  assert.match(html, /aria-expanded="false"/); assert.doesNotMatch(html, /type="date"/);
});
