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
    <div className="flex items-center font-mono text-xs text-zinc-500">
      <span>songs: {stats.totalSongs}</span>
      <span className="mx-3 text-zinc-700">|</span>
      <span className="hidden sm:inline">
        fingerprints: {stats.totalFingerprints.toLocaleString()}
      </span>
      {stats.averageFingerprintsPerSong != null && (
        <>
          <span className="hidden md:inline mx-3 text-zinc-700">|</span>
          <span className="hidden md:inline">
            avg: {Math.round(stats.averageFingerprintsPerSong).toLocaleString()} fp/song
          </span>
        </>
      )}
    </div>
  );
}
