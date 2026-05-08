import React from 'react';

/**
 * Formats an ISO date string into a human-readable format.
 * e.g. "2026-05-08T12:00:00Z" → "May 8, 2026"
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * A single news article card.
 *
 * @param {{ article: {
 *   title: string,
 *   description: string,
 *   urlToImage?: string,
 *   image_url?: string,
 *   source: { name: string } | string,
 *   author?: string,
 *   creator?: string[],
 *   publishedAt?: string,
 *   pubDate?: string,
 *   url?: string,
 *   link?: string,
 * }}} props
 */
const NewsCard = ({ article }) => {
  const image = article.urlToImage || article.image_url;
  const sourceName =
    typeof article.source === 'object'
      ? article.source?.name
      : article.source_name || article.source_id || article.source || 'Unknown';
  const author =
    article.author ||
    (article.creator && article.creator[0]) ||
    '';
  const date = article.publishedAt || article.pubDate;
  const link = article.url || article.link;

  return (
    <div className="group bg-gray-900/70 border border-gray-700/50 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/30 flex flex-col">
      {/* Image */}
      {image ? (
        <img
          src={image}
          alt={article.title}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
            e.target.nextSibling?.classList.remove('hidden');
          }}
        />
      ) : null}

      {/* Placeholder — shown if no image or image fails to load */}
      <div
        className={`w-full h-48 bg-gray-800 flex items-center justify-center text-5xl ${
          image ? 'hidden' : ''
        }`}
      >
        📰
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Source + Author + Date */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
          <span className="text-cyan-500 font-medium">{sourceName}</span>
          {author && (
            <>
              <span>·</span>
              <span className="truncate max-w-[120px]">{author}</span>
            </>
          )}
          {date && (
            <>
              <span>·</span>
              <span>{formatDate(date)}</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {article.description || 'No description available.'}
        </p>

        {/* Read More */}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors mt-auto"
        >
          Read More
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </a>
      </div>
    </div>
  );
};

export default NewsCard;
