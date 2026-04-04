import type { MatchResponse } from '../api/types';

interface Props {
  response: MatchResponse | null;
}

export default function MatchResults({ response }: Props) {
  if (!response) return null;

  const { results, queryFingerprints, queryDurationSeconds } = response;

  return (
    <div className="w-full max-w-lg mx-auto mt-8 space-y-3 animate-slide-up">
      {/* Query summary */}
      <p className="font-mono text-xs text-zinc-600">
        {queryDurationSeconds.toFixed(1)}s | {queryFingerprints.toLocaleString()} fingerprints
      </p>

      {results.length === 0 ? (
        /* No match */
        <div className="terminal-box px-4 py-8 text-center">
          <p className="font-mono text-sm text-zinc-400">[--] NO MATCH FOUND</p>
          <p className="font-mono text-xs text-zinc-600 mt-1">
            Try a longer clip or add more songs to the library.
          </p>
        </div>
      ) : (
        /* Match results */
        <div className="space-y-2">
          {results.map((match, idx) => {
            const isTop = idx === 0;
            const confidenceColor =
              match.confidence >= 50 ? 'text-green-400' :
              match.confidence >= 20 ? 'text-yellow-500' :
              'text-zinc-500';
            const barColor =
              match.confidence >= 50 ? 'bg-green-400' :
              match.confidence >= 20 ? 'bg-yellow-500' :
              'bg-zinc-600';

            return (
              <div
                key={match.songId}
                className={`p-4 border transition-colors duration-150 ${
                  isTop
                    ? 'bg-green-400/[0.06] border-green-400/20'
                    : 'terminal-box'
                }`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-mono font-bold text-sm text-zinc-100 truncate">
                      <span className="text-zinc-600 mr-2">[#{idx + 1}]</span>
                      {match.title}
                    </h3>
                    <p className="font-mono text-xs text-zinc-500 truncate mt-0.5 ml-8">
                      {match.artist || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="flex-shrink-0 text-right">
                    <span className={`font-mono text-xs tabular-nums ${confidenceColor}`}>
                      [confidence: {match.confidence.toFixed(1)}]
                    </span>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-3 h-px bg-zinc-800">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${Math.min(100, match.confidence)}%` }}
                  />
                </div>

                {/* Detail row */}
                <p className="mt-2 font-mono text-xs text-zinc-600">
                  aligned: {match.alignedMatches}  total: {match.totalMatches}  offset: {match.timeOffsetSeconds.toFixed(1)}s
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
