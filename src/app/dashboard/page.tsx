'use client';

import React, { useState } from 'react';
import { salesData } from '../../../data/salesData';
import SalesChartComponent from '../../../components/organisms/SalesChartComponent';
import YearSelectorComponent from '../../../components/molecules/YearSelectorComponent';

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState('2015');

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sales Dashboard</h1>
      <YearSelectorComponent selectedYear={selectedYear} setSelectedYear={setSelectedYear} />
      <SalesChartComponent data={salesData[selectedYear]} year={selectedYear} />
    </main>
  );
}
