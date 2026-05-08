import React from 'react';
import useISSTracker from '../../hooks/useISSTracker';
import ISSMap from './ISSMap';
import ISSTracker from './ISSTracker';

/**
 * Parent section that calls useISSTracker once and distributes
 * data to ISSMap and ISSTracker.
 */
const ISSSection = () => {
  const {
    position,
    speed,
    locationName,
    trajectory,
    positionCount,
    loading,
    error,
    refreshManually,
  } = useISSTracker();

  return (
    <section className="space-y-6">
      {/* Map — full width on top */}
      <ISSMap
        position={position}
        positions={trajectory}
        speed={speed}
      />

      {/* Card */}
      <div className="max-w-xl">
        <ISSTracker
          position={position}
          speed={speed}
          locationName={locationName}
          positionCount={positionCount}
          loading={loading}
          error={error}
          onRefresh={refreshManually}
        />
      </div>
    </section>
  );
};

export default ISSSection;
