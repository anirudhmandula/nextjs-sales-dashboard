"use client";

import React, { useMemo, useState } from "react";
import YearSelectorComponent from "./molecules/YearSelectorComponent";
import SalesChartComponent from "./organisms/SalesChartComponent";

import { aggregateCsv, CsvData, detectColumns, Mapping, parseCsv } from "../lib/salesCsv";

interface Props {
  salesData: Record<string, { month: string; sales: number }[]>;
}

const ClientDashboard: React.FC<Props> = ({ salesData }) => {
  const availableYears = Object.keys(salesData || {});
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || "");

  const [uploaded, setUploaded] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<Mapping>({ value: '', group: '', year: '', dateOrder: 'mdy', decimal: '.' });
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const result = useMemo(() => uploaded && mapping.value ? aggregateCsv(uploaded, mapping) : null, [uploaded, mapping]);
  const points = uploaded ? result?.points || [] : salesData[selectedYear] || [];
  const valueLabel = uploaded ? mapping.value || 'Sales' : 'Sales';

  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!/\.csv$/i.test(file.name)) { setError('Please choose a .csv file.'); return; }
    if (file.size > 25 * 1024 * 1024) { setError('Please choose a CSV smaller than 25 MB.'); return; }
    setLoading(true);
    try {
      const parsed = parseCsv(await file.text());
      setUploaded(parsed);
      setMapping(detectColumns(parsed));
      setFilename(file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to read this CSV.');
    } finally { setLoading(false); }
  }

  function columnSelect(label: string, key: 'value' | 'group' | 'year', empty: string) {
    return <label className="flex flex-col gap-1 text-sm font-medium">{label}
      <select className="border rounded p-2 bg-white" value={mapping[key]} onChange={e => setMapping(current => ({ ...current, [key]: e.target.value }))}>
        <option value="">{empty}</option>
        {uploaded?.headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </label>;
  }

  return (
    <div>
      <section className="mb-8 rounded border border-gray-300 bg-gray-50 p-5">
        <h2 className="text-xl font-semibold mb-2">Upload sales CSV</h2>
        <p className="text-sm text-gray-600 mb-4">Choose a CSV with column headers. We detect sales and date columns automatically; you can adjust them below. Files stay in your browser and are cleared on refresh.</p>
        <label className="block font-medium">CSV file (up to 25 MB)
          <input type="file" accept=".csv,text/csv" disabled={loading} className="block mt-2" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {loading && <p role="status">Reading CSV…</p>}
        {error && <p role="alert" className="mt-3 text-red-700">{error} Your previous chart has been kept.</p>}
        {uploaded && <>
          <p className="mt-4 text-sm">{filename} · {uploaded.rows.length.toLocaleString()} rows</p>
          <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {columnSelect('Sales / revenue column', 'value', 'Choose a numeric column')}
            {columnSelect('Group by date or category', 'group', 'Each row')}
            {/^month$/i.test(mapping.group) && columnSelect('Year column (optional)', 'year', 'Combine all years')}
            <label className="flex flex-col gap-1 text-sm font-medium">Numeric date format
              <select className="border rounded p-2" value={mapping.dateOrder} onChange={e => setMapping(m => ({ ...m, dateOrder: e.target.value as Mapping['dateOrder'] }))}>
                <option value="mdy">Month / day / year</option><option value="dmy">Day / month / year</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">Number format
              <select className="border rounded p-2" value={mapping.decimal} onChange={e => setMapping(m => ({ ...m, decimal: e.target.value as Mapping['decimal'] }))}>
                <option value=".">1,234.56</option><option value=",">1.234,56</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-sm text-gray-600">Values are summed per group. Dates are grouped by month. For ambiguous dates or numbers, check the format above.</p>
          {!mapping.value && <p role="status" className="mt-2">Choose the column containing your sales amounts to create the chart.</p>}
          {!!result?.skipped && <p role="status" className="mt-2 text-amber-800">Skipped {result.skipped.toLocaleString()} rows with missing or invalid amounts or groups.</p>}
          <button type="button" className="mt-4 underline" onClick={() => { setUploaded(null); setError(''); }}>Use sample data</button>
        </>}
      </section>
      {!uploaded && availableYears.length > 0 && <YearSelectorComponent
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
      />}
      {points.length > 0 ? <SalesChartComponent data={points.slice(0, 500)} year={selectedYear} title={uploaded ? `${valueLabel} by ${mapping.group || 'row'}` : undefined} valueLabel={valueLabel} /> : <p>No data to plot. Upload a CSV or check your column selections.</p>}
      {points.length > 500 && <p className="mt-2 text-sm">Showing the first 500 groups in the chart. All groups are listed in the table.</p>}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Sales totals</h3>
        <table className="min-w-[300px] border border-gray-300 rounded shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1 border-b text-left">{uploaded ? mapping.group || 'Row' : 'Month'}</th>
              <th className="px-3 py-1 border-b text-right">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {points
              .map((row) => (
                <tr key={row.month}>
                  <td className="px-3 py-1 border-b">{row.month}</td>
                  <td className="px-3 py-1 border-b text-right">{row.sales.toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientDashboard;
