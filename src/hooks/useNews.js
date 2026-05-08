import { useState, useEffect, useCallback } from 'react';
import {
  fetchNewsArticles,
  fetchTopHeadlines,
  handleAPIError,
} from '../utils/api';

/**
 * Custom hook that manages news fetching with caching, search,
 * category filtering, and sorting.
 *
 * @param {object} [options]
 * @param {string} [options.initialQuery='space ISS'] - Default search query.
 * @param {string} [options.initialCategory='science'] - Default headline category.
 * @param {string} [options.initialSortBy='publishedAt'] - Default sort field.
 * @param {number} [options.pageSize=10] - Articles per request.
 *
 * @returns {{
 *   articles: Array,
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => void,
 *   searchArticles: (query: string) => void,
 *   filterByCategory: (category: string) => void,
 *   sortBy: (field: string) => void,
 *   activeQuery: string,
 *   activeCategory: string,
 *   activeSortBy: string
 * }}
 */
const useNews = (options = {}) => {
  const {
    initialQuery = 'space ISS',
    initialCategory = 'science',
    initialSortBy = 'publishedAt',
    pageSize = 10,
  } = options;

  // ---- state -----------------------------------------------------------
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeSortBy, setActiveSortBy] = useState(initialSortBy);

  // ---- internal fetcher ------------------------------------------------
  const loadArticles = useCallback(
    async (query, category, sort, forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        let results;

        if (query) {
          // Full-text search
          results = await fetchNewsArticles(query, sort, pageSize, forceRefresh);
        } else {
          // Category-based
          results = await fetchTopHeadlines(category, pageSize, 'us', forceRefresh);
        }

        setArticles(results);
      } catch (err) {
        setError(handleAPIError(err));
        setArticles([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  // ---- initial load & re-fetch on dependency change --------------------
  useEffect(() => {
    loadArticles(activeQuery, activeCategory, activeSortBy);
  }, [activeQuery, activeCategory, activeSortBy, loadArticles]);

  // ---- public API ------------------------------------------------------

  /** Manually refresh with the current filters. */
  const refresh = useCallback(() => {
    loadArticles(activeQuery, activeCategory, activeSortBy, true);
  }, [activeQuery, activeCategory, activeSortBy, loadArticles]);

  /** Search articles by a new query string. */
  const searchArticles = useCallback((query) => {
    setActiveQuery(query);
  }, []);

  /** Switch to a headline category (clears the search query). */
  const filterByCategory = useCallback((category) => {
    setActiveQuery(''); // Category mode uses /top-headlines
    setActiveCategory(category);
  }, []);

  /** Change the sort order (publishedAt | relevancy | popularity). */
  const sortBy = useCallback((field) => {
    setActiveSortBy(field);
  }, []);

  return {
    articles,
    loading,
    error,
    refresh,
    searchArticles,
    filterByCategory,
    sortBy,
    activeQuery,
    activeCategory,
    activeSortBy,
  };
};

export default useNews;
