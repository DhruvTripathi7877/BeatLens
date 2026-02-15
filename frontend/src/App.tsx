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
    // Force SongLibrary to re-fetch on next render
    setLibraryKey((k) => k + 1);
  }, []);

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'listen',
      label: 'Listen',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      ),
    },
    {
      id: 'library',
      label: 'Library',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      ),
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* ── Gradient accent line at the very top ──────────────── */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-lg sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">BeatLens</h1>
              <p className="text-[11px] text-gray-500 -mt-0.5 hidden sm:block">Audio Fingerprinting</p>
            </div>
          </div>

          {/* Stats in header */}
          <StatsBar />
        </div>

        {/* ── Tab bar ──────────────────────────────────────────── */}
        <nav className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white/[0.06] text-white border-b-2 border-cyan-500'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border-b-2 border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'listen' && (
            <div className="flex flex-col items-center pt-4 animate-fade-in">
              <AudioRecorder onMatchResult={handleMatchResult} />
              <MatchResults response={matchResult} />
            </div>
          )}

          {activeTab === 'library' && (
            <div className="animate-fade-in">
              <SongLibrary key={libraryKey} />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="animate-fade-in">
              <SongUpload onUploaded={handleUploaded} />
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <span>BeatLens &mdash; Audio Fingerprinting &amp; Recognition</span>
          <span className="hidden sm:inline">Built with Spring Boot + React</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
