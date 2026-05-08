import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ---- Custom ISS icon built from a satellite emoji ----------------------
const issIcon = L.divIcon({
  html: '<span style="font-size:28px;">🛰️</span>',
  className: 'iss-marker-icon', // avoids default leaflet icon styles
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

/**
 * Inner component that re-centres the map whenever the ISS position changes.
 */
const RecenterMap = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom(), {
        animate: true,
      });
    }
  }, [position, map]);

  return null;
};

/**
 * Interactive Leaflet map showing the ISS position and trajectory.
 *
 * @param {{ position: { latitude: number, longitude: number } | null,
 *           positions: Array<{ latitude: number, longitude: number }>,
 *           speed: number }} props
 */
const ISSMap = ({ position, positions, speed }) => {
  const center = position
    ? [position.latitude, position.longitude]
    : [0, 0];

  // Convert position history to [lat, lng] pairs for the Polyline
  const trajectoryCoords = positions.map((p) => [p.latitude, p.longitude]);

  return (
    <div className="rounded-2xl overflow-hidden border border-cyan-500/20">
      <MapContainer
        center={center}
        zoom={3}
        scrollWheelZoom={true}
        style={{ height: '400px', width: '100%' }}
        className="z-0"
      >
        {/* Dark-themed OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Re-center the map on each position update */}
        <RecenterMap position={position} />

        {/* ISS Marker */}
        {position && (
          <Marker
            position={[position.latitude, position.longitude]}
            icon={issIcon}
          >
            <Tooltip direction="top" offset={[0, -16]} permanent={false}>
              <div className="text-xs leading-relaxed">
                <p><strong>Lat:</strong> {position.latitude.toFixed(4)}°</p>
                <p><strong>Lng:</strong> {position.longitude.toFixed(4)}°</p>
                <p><strong>Speed:</strong> {speed?.toLocaleString() ?? '—'} km/h</p>
              </div>
            </Tooltip>
          </Marker>
        )}

        {/* Trajectory polyline */}
        {trajectoryCoords.length > 1 && (
          <Polyline
            positions={trajectoryCoords}
            pathOptions={{
              color: '#f97316',   // orange-500
              weight: 2.5,
              opacity: 0.8,
              dashArray: '6 4',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default ISSMap;
