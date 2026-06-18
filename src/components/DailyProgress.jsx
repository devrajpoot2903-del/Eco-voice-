import React from 'react';

/**
 * DailyProgress — circular donut progress card.
 * Purely presentational; derives percentage from tasks prop.
 *
 * Props:
 *   tasks — full task array from useTasks
 */
export default function DailyProgress({ tasks = [] }) {
  const total     = tasks.length;
  const done      = tasks.filter((t) => t.done).length;
  const pct       = total === 0 ? 0 : Math.round((done / total) * 100);

  // SVG circle parameters
  const radius      = 42;
  const circumference = 2 * Math.PI * radius;  // ≈ 264
  const offset      = circumference - (pct / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-card p-5 border border-stone-100">
      <p className="text-sm font-bold text-stone-800 mb-4">Daily Progress</p>

      <div className="flex flex-col items-center">
        {/* SVG donut ring */}
        <div className="relative w-28 h-28 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Track */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="10"
            />
            {/* Fill */}
            <circle
              cx="50" cy="50" r={radius}
              fill="none"
              stroke="#4a6630"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="progress-ring-fill"
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-extrabold text-stone-800">{pct}%</span>
          </div>
        </div>

        <p className="text-xs text-stone-500 text-center">
          {done} of {total} goal{total !== 1 ? 's' : ''} achieved
        </p>
      </div>
    </div>
  );
}
