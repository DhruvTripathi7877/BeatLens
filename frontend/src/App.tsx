import { useState, useCallback } from 'react';
import AudioRecorder from './components/AudioRecorder';
import MatchResults from './components/MatchResults';
import SongLibrary from './components/SongLibrary';
import SongUpload from './components/SongUpload';
import StatsBar from './components/StatsBar';
import type { MatchResponse } from './api/types';

type Tab = 'listen' | 'library' | 'upload';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('listen');
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [libraryKey, setLibraryKey] = useState(0);

  const handleMatchResult = useCallback((result: MatchResponse) => {
    setMatchResult(result);
  }, []);

  const handleUploaded = useCallback(() => {
    // Force SongLibrary to re-fetch
    setLibraryKey((k) => k + 1);
  }, []);

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'listen',
      label: 'Listen',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      ),
    },
    {
      id: 'library',
      label: 'Library',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      ),
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">BeatLens</h1>
          </div>
          <StatsBar />
        </div>
      </header>

      {/* Tab bar */}
      <nav className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'listen' && (
            <div className="flex flex-col items-center pt-8">
              <AudioRecorder onMatchResult={handleMatchResult} />
              <MatchResults response={matchResult} />
            </div>
          )}

          {activeTab === 'library' && <SongLibrary key={libraryKey} />}

          {activeTab === 'upload' && <SongUpload onUploaded={handleUploaded} />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-3 text-center text-xs text-gray-600">
        BeatLens &mdash; Audio Fingerprinting & Recognition
      </footer>
    </div>
  );
}

export default App;
