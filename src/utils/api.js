import axios from 'axios';

// ============================================================
// SECTION E: ERROR HANDLING & RETRY LOGIC
// ============================================================

/**
 * Classifies an error and returns a user-friendly message.
 * @param {Error} error - The caught error object.
 * @returns {string} A user-friendly error message.
 */
export const handleAPIError = (error) => {
  if (!error.response) {
    // Network error or CORS issue
    console.error('[API] Network error:', error.message);
    return 'Unable to connect. Please check your internet connection.';
  }

  const { status } = error.response;

  switch (status) {
    case 401:
      console.error('[API] Unauthorized:', error.message);
      return 'API key is invalid or missing. Please check your .env file.';
    case 403:
      console.error('[API] Forbidden:', error.message);
      return 'Access denied. Your API key may lack the required permissions.';
    case 404:
      console.error('[API] Not found:', error.message);
      return 'The requested endpoint was not found.';
    case 429:
      console.error('[API] Rate limited:', error.message);
      return 'Too many requests. Please try again later.';
    default:
      if (status >= 500) {
        console.error('[API] Server error:', status, error.message);
        return 'Server error. Please try again later.';
      }
      console.error('[API] Unknown error:', status, error.message);
      return `Unexpected error (${status}). Please try again.`;
  }
};

/**
 * Fetches a URL with automatic retry logic.
 * @param {string} url - The URL to fetch.
 * @param {object} [options={}] - Axios request config.
 * @param {number} [maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [retryDelay=2000] - Milliseconds to wait between retries.
 * @returns {Promise<any>} The parsed JSON response data.
 */
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = 3,
  retryDelay = 2000,
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      console.warn(
        `[API] Attempt ${attempt + 1}/${maxRetries} failed for ${url}:`,
        error.message,
      );

      if (attempt === maxRetries - 1) {
        throw error; // Let the caller handle with handleAPIError
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

// ============================================================
// SECTION A: ISS TRACKING API
// ============================================================

/**
 * Fetches the current ISS position using an HTTPS-compatible API.
 * @returns {Promise<{ latitude: number, longitude: number, timestamp: number }>}
 */
export const fetchISSPosition = async () => {
  // Using wheretheiss.at which natively supports HTTPS
  const data = await fetchWithRetry('https://api.wheretheiss.at/v1/satellites/25544', {}, 3, 3000);

  return {
    latitude: parseFloat(data.latitude),
    longitude: parseFloat(data.longitude),
    timestamp: data.timestamp,
  };
};

/**
 * Fetches the list of astronauts currently in space.
 * @returns {Promise<{ count: number, people: Array<{ name: string, craft: string }> }>}
 */
export const fetchAstronauts = async () => {
  // Using a proxy because api.open-notify.org does not support HTTPS natively
  const data = await fetchWithRetry('https://api.allorigins.win/raw?url=http://api.open-notify.org/astros.json');

  return {
    count: data.number,
    people: data.people || [], // Each entry has { name, craft }
  };
};

/**
 * Reverse-geocodes coordinates into a human-readable location name
 * using the Nominatim (OpenStreetMap) API. Free, no key required.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<string>} e.g. "London, United Kingdom" or "Pacific Ocean"
 */
export const fetchLocationName = async (latitude, longitude) => {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json` +
      `&lat=${latitude}&lon=${longitude}&zoom=5&addressdetails=1`;

    const data = await axios.get(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'ISS-Dashboard/1.0 (student-project)',
      },
    });

    const address = data.data.address;

    if (address) {
      const city =
        address.city || address.town || address.village || address.county || '';
      const country = address.country || '';
      const ocean = address.ocean || '';

      if (ocean) return ocean;
      if (city && country) return `${city}, ${country}`;
      if (country) return country;
    }

    return data.data.display_name || 'Unknown location';
  } catch {
    // Nominatim may fail over oceans — that's expected
    return 'Over the ocean';
  }
};

// ============================================================
// SECTION B: HAVERSINE FORMULA FOR SPEED CALCULATION
// ============================================================

/**
 * Calculates the great-circle distance between two points on Earth
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees).
 * @param {number} lon1 - Longitude of point 1 (degrees).
 * @param {number} lat2 - Latitude of point 2 (degrees).
 * @param {number} lon2 - Longitude of point 2 (degrees).
 * @returns {number} Distance in kilometres.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates the ISS speed in km/h from two consecutive positions.
 *
 * @param {Array<{ latitude: number, longitude: number, timestamp: number }>} positions
 *   At least 2 positions required.
 * @param {number} [timeInterval=15] - Seconds between the two positions.
 * @returns {number} Speed in km/h, or 0 if insufficient data.
 */
export const calculateSpeed = (positions, timeInterval = 15) => {
  if (!positions || positions.length < 2) return 0;

  const latest = positions[positions.length - 1];
  const previous = positions[positions.length - 2];

  const distance = calculateDistance(
    previous.latitude,
    previous.longitude,
    latest.latitude,
    latest.longitude,
  );

  // Convert seconds → hours
  const timeInHours = timeInterval / 3600;
  const speed = distance / timeInHours;

  // Sanity check — ISS orbits at ~27,600 km/h max
  return speed > 35000 ? 0 : Math.round(speed);
};

// ============================================================
// SECTION C: NEWS API INTEGRATION
// ============================================================

const NEWS_API_BASE = 'https://newsdata.io/api/1';

/**
 * Fetches news articles via the NewsData "latest" endpoint.
 *
 * @param {string} [searchQuery='space ISS'] - Search terms.
 * @param {string} [sortBy='publishedAt'] - Ignored by NewsData free tier, kept for compat.
 * @param {number} [pageSize=10] - Ignored by NewsData free tier.
 * @returns {Promise<Array>} Array of article objects.
 */
export const fetchNewsArticles = async (
  searchQuery = 'space ISS',
  sortBy = 'publishedAt',
  pageSize = 10,
  forceRefresh = false
) => {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_NEWS_API_KEY is not set. Add it to your .env file.');
  }

  const cacheKey = `news_search_${searchQuery}`;

  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedNews(cacheKey);
    if (cached) return cached;
  }

  const data = await fetchWithRetry(`${NEWS_API_BASE}/latest`, {
    params: {
      q: searchQuery,
      language: 'en',
      apikey: apiKey,
    },
  });

  const articles = data.results || [];
  setCachedNews(cacheKey, articles);
  return articles;
};

/**
 * Fetches top headlines by category via the NewsData "latest" endpoint.
 *
 * @param {string} [category='science'] - News category.
 * @param {number} [pageSize=5] - Ignored by NewsData free tier.
 * @param {string} [country='us'] - Ignored to widen results or could be used.
 * @param {boolean} [forceRefresh=false] - Bypass cache.
 * @returns {Promise<Array>} Array of article objects.
 */
export const fetchTopHeadlines = async (
  category = 'science',
  pageSize = 5,
  country = 'us',
  forceRefresh = false
) => {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_NEWS_API_KEY is not set. Add it to your .env file.');
  }

  const cacheKey = `news_headlines_${category}`;

  if (!forceRefresh) {
    const cached = getCachedNews(cacheKey);
    if (cached) return cached;
  }

  const data = await fetchWithRetry(`${NEWS_API_BASE}/latest`, {
    params: {
      category,
      language: 'en',
      apikey: apiKey,
    },
  });

  const articles = data.results || [];
  setCachedNews(cacheKey, articles);
  return articles;
};

// ============================================================
// SECTION D: LOCALSTORAGE CACHING SYSTEM
// ============================================================

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks whether a cache entry is still valid (not expired).
 * @param {string} cacheKey - The key identifying the cached resource.
 * @returns {boolean}
 */
export const isCacheValid = (cacheKey) => {
  try {
    const expiry = localStorage.getItem(`${cacheKey}_expiry`);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  } catch {
    return false;
  }
};

/**
 * Returns cached data if the cache is still valid, otherwise null.
 * @param {string} cacheKey
 * @returns {any|null}
 */
export const getCachedNews = (cacheKey) => {
  try {
    if (!isCacheValid(cacheKey)) return null;

    const raw = localStorage.getItem(`${cacheKey}_data`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Stores data in localStorage with a 15-minute expiry timestamp.
 * @param {string} cacheKey
 * @param {any} data - JSON-serializable data.
 */
export const setCachedNews = (cacheKey, data) => {
  try {
    localStorage.setItem(`${cacheKey}_data`, JSON.stringify(data));
    localStorage.setItem(
      `${cacheKey}_expiry`,
      String(Date.now() + CACHE_DURATION_MS),
    );
  } catch (error) {
    console.warn('[Cache] Failed to write to localStorage:', error.message);
  }
};
