import { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { matchAudio } from '../api/beatlensApi';
import type { MatchResponse } from '../api/types';

interface Props {
  onMatchResult: (result: MatchResponse) => void;
}

export default function AudioRecorder({ onMatchResult }: Props) {
  const [state, actions] = useAudioRecorder();
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (state.isRecording) {
      // Stop and match
      const blob = await actions.stopRecording();
      if (!blob) return;

      setMatching(true);
      setMatchError(null);
      try {
        const result = await matchAudio(blob, 'wav');
        onMatchResult(result);
      } catch (err) {
        setMatchError(err instanceof Error ? err.message : 'Match failed');
      } finally {
        setMatching(false);
      }
    } else {
      setMatchError(null);
      await actions.startRecording();
    }
  };

  const formatDuration = (s: number) => {
    const sec = Math.floor(s);
    const ms = Math.floor((s % 1) * 10);
    return `${sec}.${ms}s`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Main listen button */}
      <button
        onClick={handleToggle}
        disabled={matching}
        className={`relative w-40 h-40 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400/50 ${
          matching
            ? 'bg-gray-700 cursor-wait'
            : state.isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/40'
            : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40 hover:scale-105'
        }`}
      >
        {/* Pulse rings when recording */}
        {state.isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
            <span className="absolute -inset-2 rounded-full border-2 border-red-400 animate-ping opacity-10" />
          </>
        )}

        <div className="relative z-10 flex flex-col items-center gap-1">
          {matching ? (
            <>
              <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span className="text-sm font-medium">Matching...</span>
            </>
          ) : state.isRecording ? (
            <>
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span className="text-sm font-medium">{formatDuration(state.duration)}</span>
            </>
          ) : (
            <>
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              <span className="text-sm font-medium">Listen</span>
            </>
          )}
        </div>
      </button>

      {/* Subtitle */}
      <p className="text-gray-400 text-sm">
        {matching
          ? 'Analyzing audio...'
          : state.isRecording
          ? 'Tap to stop and identify'
          : 'Tap to start listening'}
      </p>

      {/* Error display */}
      {(state.error || matchError) && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm max-w-sm text-center">
          {state.error || matchError}
        </div>
      )}
    </div>
  );
}
