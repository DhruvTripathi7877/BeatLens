import { useEffect, useState } from 'react';
import { getStats } from '../api/beatlensApi';
import type { Stats } from '../api/types';

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getStats().then(setStats).catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-xs text-gray-500">
      {/* Songs count */}
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-cyan-400/60" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <span>{stats.totalSongs} songs</span>
      </div>

      {/* Fingerprints count */}
      <div className="hidden sm:flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-teal-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span>{stats.totalFingerprints.toLocaleString()} fp</span>
      </div>

      {/* Avg fingerprints per song */}
      {stats.averageFingerprintsPerSong != null && (
        <div className="hidden md:flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>~{Math.round(stats.averageFingerprintsPerSong).toLocaleString()} fp/song</span>
        </div>
      )}
    </div>
  );
}
