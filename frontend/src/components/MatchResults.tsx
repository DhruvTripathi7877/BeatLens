import type { MatchResponse } from '../api/types';

interface Props {
  response: MatchResponse | null;
}

export default function MatchResults({ response }: Props) {
  if (!response) return null;

  const { results, queryFingerprints, queryDurationSeconds } = response;

  return (
    <div className="w-full max-w-lg mx-auto mt-8 space-y-4">
      {/* Query info */}
      <div className="text-center text-gray-500 text-xs">
        Query: {queryDurationSeconds.toFixed(1)}s &middot; {queryFingerprints.toLocaleString()} fingerprints
      </div>

      {results.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700/50">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-400 font-medium">No match found</p>
          <p className="text-gray-500 text-sm mt-1">Try recording a longer clip or adding more songs to the library.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((match, idx) => (
            <div
              key={match.songId}
              className={`rounded-xl p-4 border transition-all ${
                idx === 0
                  ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
                  : 'bg-gray-800/50 border-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {idx === 0 && (
                    <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full mb-2">
                      Best Match
                    </span>
                  )}
                  <h3 className={`font-semibold truncate ${idx === 0 ? 'text-lg text-white' : 'text-gray-200'}`}>
                    {match.title}
                  </h3>
                  <p className="text-gray-400 text-sm truncate">{match.artist || 'Unknown Artist'}</p>
                </div>

                {/* Confidence badge */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-2xl font-bold ${
                    match.confidence >= 50 ? 'text-green-400' :
                    match.confidence >= 20 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {match.confidence.toFixed(1)}%
                  </div>
                  <div className="text-gray-500 text-xs">confidence</div>
                </div>
              </div>

              {/* Details row */}
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>Aligned: {match.alignedMatches}</span>
                <span>Total: {match.totalMatches}</span>
                <span>Offset: {match.timeOffsetSeconds.toFixed(1)}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
