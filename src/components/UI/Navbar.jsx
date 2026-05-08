import React from 'react';

const Navbar = ({ theme, toggleTheme }) => {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span>🛰️</span>
          <span className="mono">Mission Control</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
