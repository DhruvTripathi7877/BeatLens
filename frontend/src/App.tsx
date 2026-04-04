import { useState, useCallback } from 'react';
import AudioRecorder from './components/AudioRecorder';
import LibraryGlance from './components/LibraryGlance';
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
    setLibraryKey((k) => k + 1);
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'listen', label: 'LISTEN' },
    { id: 'library', label: 'LIBRARY' },
    { id: 'upload', label: 'UPLOAD' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-mono">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-zinc-950 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <span className="font-mono font-bold text-sm text-green-400">[ BEATLENS ]</span>
            <span className="font-mono text-xs text-zinc-600 ml-3 hidden sm:inline">// audio fingerprinting</span>
          </div>

          {/* Stats */}
          <StatsBar />
        </div>

        {/* ── Tab bar ───────────────────────────────────────────── */}
        <nav className="max-w-5xl mx-auto px-6">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`font-mono text-xs py-2 px-4 border-b transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'text-green-400 border-green-400'
                    : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                }`}
              >
                {activeTab === tab.id ? `> ${tab.label}` : tab.label}
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
              {!matchResult && <LibraryGlance />}
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
      <footer className="border-t border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between font-mono text-xs text-zinc-700">
          <span>BeatLens // audio fingerprinting</span>
          <span className="hidden sm:inline">identify any song. instantly.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
