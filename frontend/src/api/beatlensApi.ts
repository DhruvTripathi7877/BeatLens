import type { Song, MatchResponse, Stats } from './types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

/** Upload and index a song. */
export async function uploadSong(
  file: File,
  title: string,
  artist?: string,
): Promise<Song> {
  const form = new FormData();
  form.append('file', file);
  form.append('title', title);
  if (artist) form.append('artist', artist);

  const res = await fetch(`${BASE}/songs/upload`, { method: 'POST', body: form });
  return handleResponse<Song>(res);
}

/** List all indexed songs. */
export async function listSongs(): Promise<Song[]> {
  const res = await fetch(`${BASE}/songs`);
  return handleResponse<Song[]>(res);
}

/** Get a single song by ID. */
export async function getSong(id: number): Promise<Song> {
  const res = await fetch(`${BASE}/songs/${id}`);
  return handleResponse<Song>(res);
}

/** Delete a song. */
export async function deleteSong(id: number): Promise<void> {
  const res = await fetch(`${BASE}/songs/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Delete failed: ${res.status}`);
  }
}

/** Match an audio blob against the database. */
export async function matchAudio(
  blob: Blob,
  format: 'wav' | 'pcm' = 'wav',
): Promise<MatchResponse> {
  const form = new FormData();
  form.append('file', blob, format === 'wav' ? 'query.wav' : 'query.pcm');
  form.append('format', format);

  const res = await fetch(`${BASE}/match`, { method: 'POST', body: form });
  return handleResponse<MatchResponse>(res);
}

/** Get database statistics. */
export async function getStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/stats`);
  return handleResponse<Stats>(res);
}
