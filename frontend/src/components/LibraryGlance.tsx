import { useEffect, useState } from 'react';
import { getRandomSongs } from '../api/beatlensApi';
import type { Song } from '../api/types';

export default function LibraryGlance() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetch = () => {
      getRandomSongs(5)
        .then((songs) => {
          if (songs.length === 0) return;
          setSongs(songs);
          setCurrent(0);
        })
        .catch(() => {});
    };

    fetch();
    const refetch = setInterval(fetch, 30_000);
    return () => clearInterval(refetch);
  }, []);

  useEffect(() => {
    if (songs.length <= 1) return;
    const slide = setInterval(() => {
      setCurrent((c) => (c + 1) % songs.length);
    }, 3500);
    return () => clearInterval(slide);
  }, [songs]);

  if (songs.length === 0) return null;

  const song = songs[current];

  return (
    <div className="w-full max-w-lg mx-auto mt-4">
      <div className="terminal-box px-4 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
          // try matching
        </p>

        <div key={current} className="animate-slide-in overflow-hidden">
          <p className="font-mono text-xs text-zinc-400 truncate">
            {song.title}
            {song.artist && (
              <span className="text-zinc-600"> — {song.artist}</span>
            )}
          </p>
        </div>

        {songs.length > 1 && (
          <div className="flex items-center gap-2 mt-3">
            {songs.map((_, i) => (
              <span
                key={i}
                className={`font-mono text-xs transition-colors duration-500 ${
                  i === current ? 'text-green-400' : 'text-zinc-700'
                }`}
              >
                {i === current ? '●' : '○'}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
