import { useCallback, useEffect, useMemo, useState } from 'react';
import { deleteSong, listSongs } from '../api/beatlensApi';
import type { Song } from '../api/types';

export default function SongLibrary() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchSongs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSongs();
      setSongs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const filteredSongs = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q)),
    );
  }, [songs, search]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this song and all its fingerprints?')) return;
    try {
      await deleteSong(id);
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const formatDuration = (sec: number | null) => {
    if (sec == null) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="font-mono text-sm text-zinc-500">{'> loading library...'}</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          // LIBRARY{' '}
          <span className="text-zinc-700">({songs.length} {songs.length === 1 ? 'song' : 'songs'})</span>
        </p>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center">
            <span className="font-mono text-green-400 text-sm mr-1">{'>'}</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search..."
              className="terminal-input w-44 py-1.5 text-sm"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchSongs}
            className="font-mono text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            [refresh]
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="font-mono text-xs text-red-400 mb-3">[ERR] {error}</p>
      )}

      {/* Empty states */}
      {songs.length === 0 ? (
        <div className="terminal-box px-4 py-10 text-center">
          <p className="font-mono text-sm text-zinc-500">[--] no songs indexed</p>
          <p className="font-mono text-xs text-zinc-700 mt-1">
            Upload WAV files in the Upload tab to build your library.
          </p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="terminal-box px-4 py-8 text-center">
          <p className="font-mono text-sm text-zinc-500">[--] no results for &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        /* Song list */
        <div className="terminal-box divide-y divide-white/[0.06]">
          {filteredSongs.map((song, idx) => (
            <div
              key={song.id}
              className="px-4 py-3 flex items-center gap-4 group transition-colors duration-150 hover:bg-zinc-800"
            >
              {/* Track number */}
              <span className="font-mono text-xs text-zinc-700 tabular-nums w-6 flex-shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-zinc-100 truncate">{song.title}</p>
                <p className="font-mono text-xs text-zinc-500 truncate mt-0.5">
                  {song.artist || 'Unknown Artist'}
                </p>
              </div>

              {/* Metadata */}
              <div className="hidden sm:block font-mono text-xs text-zinc-600 flex-shrink-0 tabular-nums">
                {formatDuration(song.durationSeconds)}{'  '}{song.fingerprintCount.toLocaleString()} fp{'  '}{formatDate(song.indexedAt)}
              </div>

              {/* Delete */}
              <button
                onClick={() => handleDelete(song.id)}
                className="opacity-0 group-hover:opacity-100 font-mono text-xs text-zinc-600 hover:text-red-400 transition-all ml-2"
              >
                [x]
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
