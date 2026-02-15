import type { MatchResponse } from '../api/types';

interface Props {
  response: MatchResponse | null;
}

export default function MatchResults({ response }: Props) {
  if (!response) return null;

  const { results, queryFingerprints, queryDurationSeconds } = response;

  return (
    <div className="w-full max-w-lg mx-auto mt-10 space-y-4 animate-slide-up">
      {/* ── Query summary ─────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {queryDurationSeconds.toFixed(1)}s
        </span>
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {queryFingerprints.toLocaleString()} fingerprints
        </span>
      </div>

      {results.length === 0 ? (
        /* ── No match ────────────────────────────────────────── */
        <div className="glass p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.04] flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium">No match found</p>
          <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">
            Try recording a longer clip or adding more songs to the library.
          </p>
        </div>
      ) : (
        /* ── Match results ───────────────────────────────────── */
        <div className="space-y-3">
          {results.map((match, idx) => {
            const isTop = idx === 0;
            const confidenceColor =
              match.confidence >= 50 ? 'text-emerald-400' :
              match.confidence >= 20 ? 'text-amber-400' :
              'text-gray-400';
            const barColor =
              match.confidence >= 50 ? 'bg-emerald-500' :
              match.confidence >= 20 ? 'bg-amber-500' :
              'bg-gray-500';

            return (
              <div
                key={match.songId}
                className={`rounded-2xl p-5 border transition-all duration-200 ${
                  isTop
                    ? 'bg-gradient-to-br from-cyan-500/[0.08] to-teal-500/[0.05] border-cyan-500/20 shadow-lg shadow-cyan-500/5'
                    : 'glass'
                }`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Song info */}
                  <div className="flex-1 min-w-0">
                    {isTop && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/15 text-cyan-400 text-[11px] font-medium rounded-full mb-2">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Best Match
                      </span>
                    )}
                    <h3 className={`font-semibold truncate ${isTop ? 'text-lg text-white' : 'text-gray-200'}`}>
                      {match.title}
                    </h3>
                    <p className="text-gray-400 text-sm truncate mt-0.5">
                      {match.artist || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Confidence badge */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-2xl font-bold tabular-nums ${confidenceColor}`}>
                      {match.confidence.toFixed(1)}%
                    </div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">
                      confidence
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-3 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${Math.min(100, match.confidence)}%` }}
                  />
                </div>

                {/* Detail chips */}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                    Aligned: {match.alignedMatches}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                    Total: {match.totalMatches}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                    Offset: {match.timeOffsetSeconds.toFixed(1)}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
