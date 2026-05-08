import React from 'react';
import useISSTracker from '../../hooks/useISSTracker';
import ISSSpeedChart from './ISSSpeedChart';
import NewsDistributionChart from './NewsDistributionChart';

/**
 * Side-by-side layout for the speed and news distribution charts.
 *
 * @param {{
 *   techCount: number,
 *   scienceCount: number,
 *   onCategoryClick?: (category: string) => void
 * }} props
 */
const ChartsSection = ({ techCount, scienceCount, onCategoryClick }) => {
  const { trajectory, speed } = useISSTracker();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📊 Analytics
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Real-time ISS telemetry and article breakdown
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ISSSpeedChart positions={trajectory} speed={speed} />
        <NewsDistributionChart
          techCount={techCount}
          scienceCount={scienceCount}
          onCategoryClick={onCategoryClick}
        />
      </div>
    </section>
  );
};

export default ChartsSection;
