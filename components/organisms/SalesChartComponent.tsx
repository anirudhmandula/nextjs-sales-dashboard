'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  data: { month: string; sales: number }[];
  year: string;
  title?: string;
  valueLabel?: string;
}

const SalesChartComponent: React.FC<Props> = ({ data, year, title, valueLabel = "Sales" }) => {
  if (!data || data.length === 0) {
    return <p className="text-red-600 mt-6">No sales data available for {year}</p>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-3">{title || `Monthly Sales in ${year}`}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" name={valueLabel} stroke="#10B981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChartComponent;
