const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('lib/salesCsv.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2016 } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', source)(mod.exports, mod);
const { parseCsv, detectColumns, aggregateCsv, numberValue } = mod.exports;

test('quoted fields, escaped quotes, BOM, embedded newlines and CRLF', () => {
  const csv = parseCsv('\uFEFFDate,Revenue,Note\r\n2024-01-01,"$1,200.50","a, b\n""quoted"""\r\n');
  assert.equal(csv.rows[0][2], 'a, b\n"quoted"');
  assert.equal(aggregateCsv(csv, detectColumns(csv)).points[0].sales, 1200.5);
});
test('monthly totals preserve refunds and skip invalid dates and amounts', () => {
  const csv = parseCsv('Date,Revenue\n2024-01-01,100\n2024-01-20,-25\n2024-02-30,50\n2024-02-01,bad\n2024-02-02,0');
  assert.deepEqual(aggregateCsv(csv, detectColumns(csv)), { points: [{month:'2024-01',sales:75},{month:'2024-02',sales:0}], skipped:2 });
});
test('semicolon European numbers and day-first dates', () => {
  const csv = parseCsv('Date;Sales\n31/01/2024;1.234,50\n02/02/2024;(20,50)');
  assert.deepEqual(aggregateCsv(csv, {...detectColumns(csv), decimal:',', dateOrder:'dmy'}).points, [{month:'2024-01',sales:1234.5},{month:'2024-02',sales:-20.5}]);
});
test('separate year/month columns sort chronologically', () => {
  const csv = parseCsv('Year,Month,Revenue\n2024,March,10\n2023,January,20');
  assert.deepEqual(aggregateCsv(csv, detectColumns(csv)).points, [{month:'2023-01',sales:20},{month:'2024-03',sales:10}]);
});
test('category groups and manual mapping', () => {
  const csv = parseCsv('Product,Custom value,Other\nA,2,3\nA,4,5\nB,6,7');
  assert.equal(detectColumns(csv).value, '');
  assert.deepEqual(aggregateCsv(csv, {...detectColumns(csv),value:'Custom value',group:'Product'}).points, [{month:'A',sales:6},{month:'B',sales:6}]);
});
test('rejects malformed and empty CSV', () => {
  for (const value of ['', 'A,B', 'A,A\n1,2', 'A,B\n1', 'A,B\n"unclosed,2']) assert.throws(() => parseCsv(value));
});
test('invalid numbers do not silently become zero', () => {
  for (const value of ['', 'N/A', '12foo', '1,25', '10%']) assert.equal(numberValue(value), null);
  assert.equal(numberValue('($1,200.50)'), -1200.5);
});
test('bundled CSV remains compatible', () => {
  const csv = parseCsv(fs.readFileSync('Sales.csv','utf8'));
  const result = aggregateCsv(csv, detectColumns(csv));
  assert.equal(result.skipped, 0);
  assert.ok(result.points.length > 12);
});
