import React, { useState, useEffect, useRef } from 'react';

/**
 * Debounced search input with result count display and clear button.
 *
 * @param {{
 *   onSearch: (query: string) => void,
 *   resultCount: number,
 *   totalCount: number
 * }} props
 */
const NewsSearch = ({ onSearch, resultCount, totalCount }) => {
  const [query, setQuery] = useState('');
  const debounceRef = useRef(null);

  // Debounce the search callback by 300ms
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          🔍
        </span>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          className="w-full pl-9 pr-9 py-2.5 bg-gray-800/80 border border-gray-700/60 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm cursor-pointer"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count */}
      <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
        Showing{' '}
        <span className="text-gray-300 font-medium">{resultCount}</span>
        {totalCount > 0 && (
          <>
            {' '}of{' '}
            <span className="text-gray-300 font-medium">{totalCount}</span>
          </>
        )}{' '}
        articles
      </span>
    </div>
  );
};

export default NewsSearch;
