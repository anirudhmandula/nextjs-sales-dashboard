'use client';

import React from 'react';

interface Props {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
}

const YearSelectorComponent: React.FC<Props> = ({ selectedYear, setSelectedYear }) => {
  return (
    <div className="mb-4">
      <label className="mr-2 text-lg font-medium">Select Year:</label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="border px-3 py-2 rounded shadow-sm focus:outline-none"
      >
        <option value="2013">2013</option>
        <option value="2014">2014</option>
        <option value="2015">2015</option>
      </select>
    </div>
  );
};

export default YearSelectorComponent;
