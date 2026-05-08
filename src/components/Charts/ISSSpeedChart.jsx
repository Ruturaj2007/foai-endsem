import React, { useMemo, useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
);

/**
 * Formats a UNIX timestamp to HH:MM:SS.
 */
const formatTime = (ts) => {
  if (!ts) return '';
  const d = new Date(typeof ts === 'number' && ts < 1e12 ? ts * 1000 : ts);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Line chart showing ISS speed over time.
 *
 * @param {{ positions: Array<{ timestamp: number, speed?: number }>,
 *           speed?: number }} props
 */
const ISSSpeedChart = ({ positions, speed }) => {
  const chartRef = useRef(null);

  // Take the last 30 entries
  const recent = useMemo(() => (positions || []).slice(-30), [positions]);

  // Build labels & data
  const labels = useMemo(
    () => recent.map((p) => formatTime(p.timestamp)),
    [recent],
  );

  const speedData = useMemo(
    () =>
      recent.map((p, i) => {
        // Use per-point speed if available, otherwise fall back
        if (p.speed != null) return p.speed;
        // If this is the last point and the parent provides a current speed
        if (i === recent.length - 1 && speed != null) return speed;
        return 0;
      }),
    [recent, speed],
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Speed (km/h)',
          data: speedData,
          borderColor: '#06b6d4',
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(6,182,212,0.15)';
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, 'rgba(6,182,212,0.35)');
            gradient.addColorStop(1, 'rgba(6,182,212,0.02)');
            return gradient;
          },
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: '#06b6d4',
          tension: 0.35,
          fill: true,
        },
      ],
    }),
    [labels, speedData],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `Speed: ${ctx.parsed.y?.toLocaleString() ?? '—'} km/h`,
          },
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(6,182,212,0.3)',
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 45 },
          grid: { color: 'rgba(148,163,184,0.08)' },
        },
        y: {
          ticks: {
            color: '#94a3b8',
            font: { size: 10 },
            callback: (v) => v.toLocaleString(),
          },
          grid: { color: 'rgba(148,163,184,0.08)' },
          beginAtZero: true,
        },
      },
    }),
    [],
  );

  return (
    <div className="bg-gray-900/80 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-md">
      <h3 className="text-cyan-400 text-sm font-semibold tracking-wide mb-4 flex items-center gap-2">
        📈 ISS Speed Over Time
      </h3>
      <div style={{ height: 250 }}>
        {recent.length > 1 ? (
          <Line ref={chartRef} data={data} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            Collecting data points…
          </div>
        )}
      </div>
    </div>
  );
};

export default ISSSpeedChart;
