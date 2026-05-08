import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Doughnut chart showing Technology vs Science article distribution.
 *
 * @param {{
 *   techCount: number,
 *   scienceCount: number,
 *   onCategoryClick?: (category: string) => void
 * }} props
 */
const NewsDistributionChart = ({ techCount, scienceCount, onCategoryClick }) => {
  const chartRef = useRef(null);
  const total = techCount + scienceCount;

  const data = useMemo(
    () => ({
      labels: ['Technology', 'Science'],
      datasets: [
        {
          data: [techCount, scienceCount],
          backgroundColor: ['#8b5cf6', '#06b6d4'],
          hoverBackgroundColor: ['#a78bfa', '#22d3ee'],
          borderColor: 'transparent',
          borderWidth: 0,
          spacing: 4,
          borderRadius: 6,
        },
      ],
    }),
    [techCount, scienceCount],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(139,92,246,0.3)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} articles`,
          },
        },
      },
      onClick: (_event, elements) => {
        if (elements.length > 0 && onCategoryClick) {
          const idx = elements[0].index;
          onCategoryClick(idx === 0 ? 'technology' : 'science');
        }
      },
    }),
    [onCategoryClick],
  );

  return (
    <div className="bg-gray-900/80 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-md">
      <h3 className="text-cyan-400 text-sm font-semibold tracking-wide mb-4 flex items-center gap-2">
        🍩 News Distribution
      </h3>
      <div className="relative" style={{ height: 250 }}>
        <Doughnut ref={chartRef} data={data} options={options} />

        {/* Center overlay showing total count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginBottom: 36 }}>
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-xs text-gray-500">articles</span>
        </div>
      </div>
    </div>
  );
};

export default NewsDistributionChart;
