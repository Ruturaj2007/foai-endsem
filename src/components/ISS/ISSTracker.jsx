import React from 'react';

/**
 * Displays current ISS telemetry: coordinates, speed, location, and position count.
 * Includes loading skeleton and error states.
 */
const ISSTracker = ({
  position,
  speed,
  locationName,
  positionCount,
  loading,
  error,
  onRefresh,
}) => {
  // ---- Loading skeleton ------------------------------------------------
  if (loading && !position) {
    return (
      <div className="bg-gray-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-gray-700 rounded" />
          <div className="h-8 w-56 bg-gray-700 rounded" />
          <div className="h-8 w-56 bg-gray-700 rounded" />
          <div className="h-6 w-36 bg-gray-700 rounded" />
          <div className="h-6 w-48 bg-gray-700 rounded" />
          <div className="h-10 w-32 bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  // ---- Error state -----------------------------------------------------
  if (error) {
    return (
      <div className="bg-gray-900/80 border border-red-500/30 rounded-2xl p-6 backdrop-blur-md text-center">
        <p className="text-red-400 text-lg mb-1">⚠️ Tracking Error</p>
        <p className="text-gray-400 text-sm mb-4">{error}</p>
        <button
          onClick={onRefresh}
          className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // ---- Normal render ---------------------------------------------------
  return (
    <div className="bg-gray-900/80 border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-cyan-400 text-lg font-semibold tracking-wide flex items-center gap-2">
          🛰️ ISS Tracker
        </h2>
        <span className="text-xs text-gray-500 font-mono">
          {positionCount} / 15 pts
        </span>
      </div>

      {/* Coordinates */}
      <div className="space-y-3 mb-5">
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Latitude</span>
          <p className="text-white text-xl font-mono tracking-wider">
            {position?.latitude?.toFixed(4) ?? '—'}°
          </p>
        </div>
        <div>
          <span className="text-gray-500 text-xs uppercase tracking-wider">Longitude</span>
          <p className="text-white text-xl font-mono tracking-wider">
            {position?.longitude?.toFixed(4) ?? '—'}°
          </p>
        </div>
      </div>

      {/* Speed */}
      <div className="mb-4">
        <span className="text-gray-500 text-xs uppercase tracking-wider">Speed</span>
        <p className="text-cyan-300 text-2xl font-bold font-mono">
          {speed?.toLocaleString() ?? '—'}{' '}
          <span className="text-sm font-normal text-gray-400">km/h</span>
        </p>
      </div>

      {/* Location */}
      <div className="mb-5">
        <span className="text-gray-500 text-xs uppercase tracking-wider">Location</span>
        <p className="text-gray-300 text-sm truncate" title={locationName}>
          📍 {locationName || 'Locating…'}
        </p>
      </div>

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        className="w-full py-2.5 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 rounded-lg transition-colors text-sm font-medium cursor-pointer"
      >
        ↻ Refresh Now
      </button>
    </div>
  );
};

export default ISSTracker;
