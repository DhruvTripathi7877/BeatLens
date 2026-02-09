import { useEffect, useState } from 'react';
import { getStats } from '../api/beatlensApi';
import type { Stats } from '../api/types';

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    getStats().then(setStats).catch(() => {});
    const interval = setInterval(() => {
      getStats().then(setStats).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 text-xs text-gray-500">
      <span>{stats.totalSongs} songs</span>
      <span>{stats.totalFingerprints.toLocaleString()} fingerprints</span>
      {stats.averageFingerprintsPerSong != null && (
        <span>~{Math.round(stats.averageFingerprintsPerSong).toLocaleString()} fp/song</span>
      )}
    </div>
  );
}
