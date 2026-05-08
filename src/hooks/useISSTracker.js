import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchISSPosition,
  fetchAstronauts,
  fetchLocationName,
  calculateSpeed,
  handleAPIError,
} from '../utils/api';

const POLL_INTERVAL_MS = 15_000; // 15 seconds
const MAX_TRAJECTORY_POINTS = 15;

/**
 * Custom hook that manages real-time ISS tracking.
 *
 * Responsibilities:
 *  - Polls ISS position every 15 seconds.
 *  - Maintains a trajectory array of the last 15 positions.
 *  - Calculates speed between consecutive updates.
 *  - Resolves a human-readable location name via reverse geocoding.
 *  - Fetches the astronaut roster once on mount.
 *  - Exposes loading / error state and a manual refresh function.
 *
 * @returns {{
 *   position: { latitude: number, longitude: number } | null,
 *   speed: number,
 *   locationName: string,
 *   trajectory: Array<{ latitude: number, longitude: number, timestamp: number }>,
 *   positionCount: number,
 *   loading: boolean,
 *   error: string | null,
 *   refreshManually: () => void,
 *   astronauts: Array<{ name: string, craft: string }>,
 *   astronautCount: number
 * }}
 */
const useISSTracker = () => {
  // ---- state -----------------------------------------------------------
  const [position, setPosition] = useState(null);
  const [trajectory, setTrajectory] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [locationName, setLocationName] = useState('Locating…');
  const [astronauts, setAstronauts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref so the interval callback always sees the latest trajectory
  const trajectoryRef = useRef(trajectory);
  trajectoryRef.current = trajectory;

  // ---- ISS position fetcher --------------------------------------------
  const fetchPosition = useCallback(async () => {
    try {
      setError(null);
      const pos = await fetchISSPosition();
      
      // Calculate speed from the updated trajectory BEFORE saving it
      const prevTrajectory = trajectoryRef.current;
      const currentSpeed = calculateSpeed([...prevTrajectory, pos], 15);
      
      // Attach speed to the point so the chart has historical data
      pos.speed = currentSpeed;

      setPosition(pos);
      setSpeed(currentSpeed);

      // Update trajectory (keep last N points)
      setTrajectory((prev) => {
        const updated = [...prev, pos].slice(-MAX_TRAJECTORY_POINTS);
        trajectoryRef.current = updated;
        return updated;
      });

      // Reverse-geocode (fire-and-forget, non-blocking)
      fetchLocationName(pos.latitude, pos.longitude)
        .then(setLocationName)
        .catch(() => setLocationName('Unknown'));
    } catch (err) {
      setError(handleAPIError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Astronaut fetcher (once) ----------------------------------------
  useEffect(() => {
    const loadAstronauts = async () => {
      try {
        const data = await fetchAstronauts();
        setAstronauts(data.people);
      } catch (err) {
        console.error('[useISSTracker] Failed to fetch astronauts:', err);
      }
    };
    loadAstronauts();
  }, []);

  // ---- Polling interval ------------------------------------------------
  useEffect(() => {
    // Fetch immediately on mount
    fetchPosition();

    const intervalId = setInterval(fetchPosition, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchPosition]);

  // ---- Public API ------------------------------------------------------
  const refreshManually = useCallback(() => {
    setLoading(true);
    fetchPosition();
  }, [fetchPosition]);

  return {
    position,
    speed,
    locationName,
    trajectory,
    positionCount: trajectory.length,
    loading,
    error,
    refreshManually,
    astronauts,
    astronautCount: astronauts.length,
  };
};

export default useISSTracker;
