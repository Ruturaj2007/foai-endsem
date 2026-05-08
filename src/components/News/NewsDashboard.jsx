import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import useNews from '../../hooks/useNews';
import NewsCard from './NewsCard';
import NewsSearch from './NewsSearch';

const TABS = [
  { key: 'technology', label: 'Technology' },
  { key: 'science', label: 'Science' },
];

const SORT_OPTIONS = [
  { value: 'publishedAt', label: 'Newest First' },
  { value: 'publishedAt_asc', label: 'Oldest First' },
  { value: 'source', label: 'By Source' },
];

/**
 * Skeleton loader matching NewsCard dimensions.
 */
const SkeletonCard = () => (
  <div className="bg-gray-900/70 border border-gray-700/50 rounded-2xl overflow-hidden animate-pulse">
    <div className="w-full h-48 bg-gray-800" />
    <div className="p-5 space-y-3">
      <div className="h-4 w-3/4 bg-gray-700 rounded" />
      <div className="h-4 w-1/2 bg-gray-700 rounded" />
      <div className="h-3 w-1/3 bg-gray-700 rounded" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-700 rounded" />
        <div className="h-3 w-full bg-gray-700 rounded" />
        <div className="h-3 w-2/3 bg-gray-700 rounded" />
      </div>
      <div className="h-4 w-24 bg-gray-700 rounded" />
    </div>
  </div>
);

/**
 * Full news dashboard with tabs, search, sort, and article grid.
 */
const NewsDashboard = () => {
  const [activeTab, setActiveTab] = useState('technology');

  const {
    articles,
    loading,
    error,
    refresh,
    searchArticles,
    filterByCategory,
    sortBy,
    activeQuery,
    activeSortBy,
  } = useNews({ initialCategory: activeTab, initialQuery: '' });

  // ---- Tab switch ------------------------------------------------------
  const handleTabChange = useCallback(
    (tabKey) => {
      setActiveTab(tabKey);
      filterByCategory(tabKey);
    },
    [filterByCategory],
  );

  // ---- Search ----------------------------------------------------------
  const handleSearch = useCallback(
    (query) => {
      searchArticles(query);
    },
    [searchArticles],
  );

  // ---- Sort ------------------------------------------------------------
  const handleSortChange = useCallback(
    (e) => {
      sortBy(e.target.value);
    },
    [sortBy],
  );

  // ---- Refresh with toast ----------------------------------------------
  const handleRefresh = useCallback(() => {
    refresh();
    toast.success('News refreshed!', {
      style: {
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid rgba(6,182,212,0.3)',
      },
      iconTheme: { primary: '#06b6d4', secondary: '#0f172a' },
    });
  }, [refresh]);

  // ---- Sort articles client-side for "oldest" & "by source" ------------
  const sortedArticles = [...articles].sort((a, b) => {
    if (activeSortBy === 'publishedAt_asc') {
      return new Date(a.publishedAt || a.pubDate || 0) - new Date(b.publishedAt || b.pubDate || 0);
    }
    if (activeSortBy === 'source') {
      const sA = (typeof a.source === 'object' ? a.source?.name : a.source) || '';
      const sB = (typeof b.source === 'object' ? b.source?.name : b.source) || '';
      return sA.localeCompare(sB);
    }
    // Default: newest first
    return new Date(b.publishedAt || b.pubDate || 0) - new Date(a.publishedAt || a.pubDate || 0);
  });

  return (
    <div className="space-y-5">
      {/* ---- Tabs + Refresh ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-800/60 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? '↻ Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* ---- Search + Sort ---- */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1">
          <NewsSearch
            onSearch={handleSearch}
            resultCount={sortedArticles.length}
            totalCount={articles.length}
          />
        </div>

        <select
          value={activeSortBy}
          onChange={handleSortChange}
          className="bg-gray-800/80 border border-gray-700/60 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Error state ---- */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
          <p className="text-red-400 mb-1">⚠️ {error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Loading skeletons ---- */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ---- Article grid ---- */}
      {!loading && !error && sortedArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedArticles.map((article, idx) => (
            <NewsCard key={article.url || article.link || idx} article={article} />
          ))}
        </div>
      )}

      {/* ---- Empty state ---- */}
      {!loading && !error && sortedArticles.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-lg">No articles found</p>
          <p className="text-sm mt-1">
            {activeQuery
              ? `Try a different search term`
              : `No headlines available for this category`}
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;
