import fs from 'fs';
import path from 'path';
import ClientDashboard from '../../components/ClientDashboard';

type Row = Record<string, string>;

function parseCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Row[] = lines.slice(1).map((line) => {
    const cols = line.split(',');
    const obj: Row = {};
    headers.forEach((h, i) => {
      // Trim all values to avoid whitespace issues
      obj[h] = (cols[i] || '').trim();
    });
    return obj;
  });
  return rows;
}

function aggregate(rows: Row[]) {
  const map: Record<string, Record<string, number>> = {};
  rows.forEach((r) => {
    const year = (r['Year'] || '').trim();
    let month = (r['Month'] || '').trim();
    const revenue = Number((r['Revenue'] || '').replace(/[^\d.]/g, '')) || 0;
    // Normalize month names to match monthOrder
    month = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    if (!map[year]) map[year] = {};
    if (!map[year][month]) map[year][month] = 0;
    map[year][month] += revenue;
  });

  const monthOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const result: Record<string, { month: string; sales: number }[]> = {};
  Object.keys(map).forEach((year) => {
    result[year] = monthOrder.map((m) => ({ month: m.slice(0,3), sales: map[year][m] || 0 }));
  });
  return result;
}

export default async function Page() {
  const csvPath = path.join(process.cwd(), 'Sales.csv');
  let csv = '';
  try {
    csv = fs.readFileSync(csvPath, 'utf8');
  } catch (e) {
    // fallback empty
    csv = '';
  }

  const rows = csv ? parseCsv(csv) : [];
  const salesData = aggregate(rows);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
      <ClientDashboard salesData={salesData} />
    </main>
  );
}
