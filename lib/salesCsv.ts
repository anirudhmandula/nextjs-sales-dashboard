export type CsvData = { headers: string[]; rows: string[][] };
export type Mapping = { value: string; group: string; year: string; dateOrder: 'mdy' | 'dmy'; decimal: '.' | ',' };
export type Point = { month: string; sales: number };

export function parseCsv(input: string): CsvData {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter = [',', ';', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const records: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ''; closed = false; };
  const pushRow = () => { pushField(); if (row.some(Boolean)) records.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else field += c;
    } else if (c === delimiter) pushField();
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; pushRow(); }
    else if (c === '"' && !field && !closed) quoted = true;
    else if (closed && c.trim()) throw new Error('Invalid CSV: unexpected text after a quoted field.');
    else if (!closed) field += c;
  }
  if (quoted) throw new Error('Invalid CSV: an opening quote has no closing quote.');
  pushRow();
  if (records.length < 2) throw new Error('The CSV needs a header row and at least one data row.');
  const headers = records.shift()!;
  if (headers.some(h => !h) || new Set(headers).size !== headers.length) throw new Error('Each column needs a unique, nonempty header.');
  if (records.some(r => r.length !== headers.length)) throw new Error('Some rows have a different number of columns. Check the CSV delimiter and quoting.');
  return { headers, rows: records };
}

export function numberValue(raw: string, decimal: '.' | ',' = '.'): number | null {
  let value = raw.trim();
  if (!value) return null;
  const negative = /^\(.*\)$/.test(value);
  value = value.replace(/[()\s$€£¥₹]/g, '');
  const pattern = decimal === '.' ? /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/ : /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;
  if (!pattern.test(value)) return null;
  value = decimal === '.' ? value.replace(/,/g, '') : value.replace(/\./g, '').replace(',', '.');
  const result = Number(value) * (negative ? -1 : 1);
  return Number.isFinite(result) ? result : null;
}

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dateKey(raw: string, order: 'mdy' | 'dmy'): string | null {
  let y: number, m: number, d: number;
  let match = raw.match(/^(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?(?:[T ].*)?$/);
  if (match) { y = +match[1]; m = +match[2]; d = +(match[3] || 1); }
  else {
    match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (!match) return null;
    y = +match[3]; m = +(order === 'mdy' ? match[1] : match[2]); d = +(order === 'mdy' ? match[2] : match[1]);
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? `${y}-${String(m).padStart(2, '0')}` : null;
}

export function detectColumns(data: CsvData): Mapping {
  const normalized = data.headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const find = (names: string[]) => { for (const name of names) { const i = normalized.indexOf(name); if (i >= 0) return data.headers[i]; } return ''; };
  const value = find(['revenue','netsales','sales','salesamount','totalrevenue','total sales'.replace(' ', ''),'amount','totalamount','ordertotal','total','profit']);
  const sample = data.rows.slice(0, 100);
  const dateIndex = data.headers.findIndex((_, i) => sample.filter(r => dateKey(r[i], 'mdy')).length / sample.length > .8);
  const numeric = data.headers.filter((_, i) => !/id|year|month|day|date|zip|code/.test(normalized[i]) && sample.filter(r => numberValue(r[i]) !== null).length / sample.length > .8);
  const group = find(['date','orderdate','saledate','salesdate','transactiondate','month','year']) || (dateIndex >= 0 ? data.headers[dateIndex] : data.headers.find(h => h !== value && !numeric.includes(h)) || '');
  return { value: value || (numeric.length === 1 ? numeric[0] : ''), group, year: find(['year']), dateOrder: 'mdy', decimal: '.' };
}

export function aggregateCsv(data: CsvData, mapping: Mapping) {
  const vi = data.headers.indexOf(mapping.value), gi = data.headers.indexOf(mapping.group), yi = data.headers.indexOf(mapping.year);
  const totals = new Map<string, number>();
  let skipped = 0;
  const dateMode = /date/i.test(mapping.group) || data.rows.slice(0, 100).some(r => dateKey(r[gi] || '', mapping.dateOrder));
  const monthMode = /^month$/i.test(mapping.group);
  data.rows.forEach((row, index) => {
    const amount = numberValue(row[vi] || '', mapping.decimal);
    let key = gi < 0 ? `Row ${index + 1}` : row[gi];
    if (dateMode) key = dateKey(key, mapping.dateOrder) || '';
    else if (monthMode) {
      const month = /^\d+$/.test(key) ? +key - 1 : months.findIndex(m => m.toLowerCase() === key.slice(0, 3).toLowerCase());
      const year = yi >= 0 ? row[yi] : '';
      key = month >= 0 && month < 12 && (!year || /^\d{4}$/.test(year)) ? `${year ? year + '-' : ''}${String(month + 1).padStart(2, '0')}` : '';
    }
    if (amount === null || !key) { skipped++; return; }
    totals.set(key, (totals.get(key) || 0) + amount);
  });
  const entries = Array.from(totals.entries());
  if (dateMode || monthMode || /^year$/i.test(mapping.group)) entries.sort(([a], [b]) => a.localeCompare(b));
  return { points: entries.map(([month, sales]) => ({ month, sales })), skipped };
}
