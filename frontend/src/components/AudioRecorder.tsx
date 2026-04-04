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
      const blob = await actions.stopRecording();
      if (!blob) return;

      setMatching(true);
      setMatchError(null);
      try {
        const result = await matchAudio(blob);
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

  const buttonLabel = matching
    ? '[ IDENTIFYING... ]'
    : state.isRecording
      ? `[ STOP ]  ${formatDuration(state.duration)}`
      : '[ LISTEN ]';

  const buttonClass = matching
    ? 'font-mono w-full py-3 text-sm border border-zinc-700 text-zinc-500 bg-transparent rounded-none cursor-wait disabled:opacity-100'
    : state.isRecording
      ? 'font-mono w-full py-3 text-sm border border-red-400/40 text-red-400 bg-transparent rounded-none transition-colors hover:bg-red-400/[0.08] animate-recording-pulse'
      : 'btn-terminal-accent w-full py-3 text-sm';

  const statusText = matching
    ? '> analyzing fingerprint against library'
    : state.isRecording
      ? '> listening... tap stop to identify'
      : '> tap to identify music around you';

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="terminal-box p-6 flex flex-col gap-4">
        {/* Visualizer strip */}
        <AudioVisualizer
          analyserNode={state.analyserNode}
          isRecording={state.isRecording}
          isMatching={matching}
        />

        {/* Main button */}
        <button
          onClick={handleToggle}
          disabled={matching}
          className={buttonClass}
        >
          {buttonLabel}
        </button>

        {/* Status line */}
        <p className="font-mono text-xs text-zinc-500">
          {statusText}
          {matching && <span className="animate-blink">_</span>}
        </p>
      </div>

      {/* Error */}
      {(state.error || matchError) && (
        <p className="font-mono text-xs text-red-400 mt-3">
          [ERR] {state.error || matchError}
        </p>
      )}
    </div>
  );
}
