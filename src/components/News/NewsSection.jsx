import React from 'react';
import NewsDashboard from './NewsDashboard';

/**
 * Wraps NewsDashboard with a section heading.
 */
const NewsSection = () => {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          📡 Space &amp; Tech News
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Latest headlines from around the world
        </p>
      </div>

      <NewsDashboard />
    </section>
  );
};

export default NewsSection;
