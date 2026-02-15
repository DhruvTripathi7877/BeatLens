import { useState } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { matchAudio } from '../api/beatlensApi';
import AudioVisualizer from './AudioVisualizer';
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
      // Stop recording and send for matching
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
    <div className="flex flex-col items-center gap-8">
      {/* ── Visualizer + Button container ─────────────────────── */}
      <div className="relative" style={{ width: 280, height: 280 }}>
        {/* Canvas visualizer (drawn behind/around the button) */}
        <AudioVisualizer
          analyserNode={state.analyserNode}
          isRecording={state.isRecording}
          isMatching={matching}
          size={280}
        />

        {/* Main circular listen button */}
        <button
          onClick={handleToggle}
          disabled={matching}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-40 h-40 rounded-full transition-all duration-300
            focus:outline-none focus:ring-4 focus:ring-cyan-400/30 ${
              matching
                ? 'bg-gray-800 cursor-wait shadow-lg shadow-gray-800/40'
                : state.isRecording
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 animate-recording-pulse'
                  : 'bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/35 hover:scale-105 active:scale-95'
            }`}
        >
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            {matching ? (
              <>
                <svg className="w-9 h-9 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-xs font-medium opacity-80">Matching</span>
              </>
            ) : state.isRecording ? (
              <>
                <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span className="text-sm font-semibold tabular-nums">
                  {formatDuration(state.duration)}
                </span>
              </>
            ) : (
              <>
                <svg className="w-11 h-11" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                <span className="text-xs font-medium">Tap to listen</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* ── Status text ───────────────────────────────────────── */}
      <p className="text-gray-400 text-sm text-center max-w-xs">
        {matching
          ? 'Analyzing audio fingerprint against the library...'
          : state.isRecording
            ? 'Listening... Tap to stop and identify the song'
            : 'Tap the button to start listening to music around you'}
      </p>

      {/* ── Error display ─────────────────────────────────────── */}
      {(state.error || matchError) && (
        <div className="glass border-red-500/20 bg-red-500/[0.06] text-red-400 px-5 py-3 rounded-xl text-sm max-w-sm text-center animate-scale-in">
          <div className="flex items-center gap-2 justify-center">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{state.error || matchError}</span>
          </div>
        </div>
      )}
    </div>
  );
}
