'use client';

import React from 'react';

interface Props {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  availableYears: string[];
}

const YearSelectorComponent: React.FC<Props> = ({
  selectedYear,
  setSelectedYear,
  availableYears,
}) => {
  return (
    <div className="mb-4">
      <label className="mr-2 text-lg font-medium">Select Year:</label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
        className="border px-3 py-2 rounded shadow-sm focus:outline-none"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelectorComponent;
