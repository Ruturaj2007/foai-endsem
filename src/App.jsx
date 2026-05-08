import React from 'react';
import { Toaster } from 'react-hot-toast';

import useTheme from './hooks/useTheme';
import useISSTracker from './hooks/useISSTracker';
import useNews from './hooks/useNews';

import Navbar from './components/UI/Navbar';
import ISSSection from './components/ISS/ISSSection';
import ChartsSection from './components/Charts/ChartsSection';
import NewsSection from './components/News/NewsSection';
import ChatbotButton from './components/Chatbot/ChatbotButton';

function App() {
  const { theme, toggleTheme } = useTheme();
  
  // ISS Tracker state
  const {
    position,
    trajectory,
    speed,
    locationName,
    astronauts,
    loading,
    error
  } = useISSTracker();

  // News states
  const { articles: techArticles } = useNews({ initialCategory: 'technology' });
  const { articles: sciArticles } = useNews({ initialCategory: 'science' });

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="bg-gray-100 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
          {/* 1. ISS Tracker + People in Space + Map */}
          <ISSSection />
          
          {/* 2. Charts */}
          <ChartsSection
            techCount={techArticles.length}
            scienceCount={sciArticles.length}
          />
          
          {/* 3. News Dashboard */}
          <NewsSection />
        </main>

        <ChatbotButton
          issData={{ position, speed, locationName, astronauts }}
          newsArticles={[...techArticles, ...sciArticles]}
        />

        <Toaster position="bottom-left" />
      </div>
    </div>
  );
}

export default App;
