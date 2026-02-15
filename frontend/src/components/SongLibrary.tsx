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

  // Client-side filtering by title or artist
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

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <svg className="w-8 h-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm text-gray-500">Loading library...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ── Header row ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Song Library</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {songs.length} {songs.length === 1 ? 'song' : 'songs'} indexed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs..."
              className="input-field pl-9 pr-4 py-2 text-sm w-56"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchSongs}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
            title="Refresh library"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="glass border-red-500/20 bg-red-500/[0.06] text-red-400 px-4 py-3 rounded-xl text-sm mb-4 animate-scale-in">
          {error}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {songs.length === 0 ? (
        <div className="glass p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium">No songs indexed yet</p>
          <p className="text-gray-500 text-sm mt-1.5 max-w-xs mx-auto">
            Upload WAV files in the Upload tab to start building your fingerprint library.
          </p>
        </div>
      ) : filteredSongs.length === 0 ? (
        /* ── No search results ────────────────────────────────── */
        <div className="glass p-8 text-center">
          <p className="text-gray-400">No songs matching &ldquo;{search}&rdquo;</p>
        </div>
      ) : (
        /* ── Song list ────────────────────────────────────────── */
        <div className="space-y-2">
          {filteredSongs.map((song, idx) => (
            <div
              key={song.id}
              className="glass-hover p-4 flex items-center gap-4 group"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Track number / icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>

              {/* Song info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate text-sm">{song.title}</h3>
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {song.artist || 'Unknown Artist'}
                </p>
              </div>

              {/* Metadata chips */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-gray-500 flex-shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                  {formatDuration(song.durationSeconds)}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                  {song.fingerprintCount.toLocaleString()} fp
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.04]">
                  {formatDate(song.indexedAt)}
                </span>
              </div>

              {/* Delete button (visible on hover) */}
              <button
                onClick={() => handleDelete(song.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete song"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
