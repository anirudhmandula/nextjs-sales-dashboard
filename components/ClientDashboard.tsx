"use client";

import React, { useState } from "react";
import YearSelectorComponent from "./molecules/YearSelectorComponent";
import SalesChartComponent from "./organisms/SalesChartComponent";

interface Props {
  salesData: Record<string, { month: string; sales: number }[]>;
}

const ClientDashboard: React.FC<Props> = ({ salesData }) => {
  const availableYears = Object.keys(salesData || {});
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || "");

  if (!availableYears || availableYears.length === 0) {
    return <p className="text-red-600">No sales data available.</p>;
  }

  return (
    <div>
      <YearSelectorComponent
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
      />
      <SalesChartComponent data={salesData[selectedYear]} year={selectedYear} />
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Raw Data Table</h3>
        <table className="min-w-[300px] border border-gray-300 rounded shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-1 border-b text-left">Month</th>
              <th className="px-3 py-1 border-b text-right">Sales</th>
            </tr>
          </thead>
          <tbody>
            {(salesData[selectedYear] || [])
              .slice() // copy array
              .sort((a, b) => {
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                return months.indexOf(a.month) - months.indexOf(b.month);
              })
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
