import { useCallback, useRef, useState } from 'react';
import { uploadSong } from '../api/beatlensApi';

interface Props {
  onUploaded?: () => void;
}

export default function SongUpload({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) {
        setFile(dropped);
        if (!title) {
          setTitle(dropped.name.replace(/\.\w+$/, ''));
        }
      }
    },
    [title],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title) {
      setTitle(selected.name.replace(/\.\w+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const song = await uploadSong(file, title.trim(), artist.trim() || undefined);
      setSuccess(
        `"${song.title}" indexed successfully with ${song.fingerprintCount.toLocaleString()} fingerprints`,
      );
      setFile(null);
      setTitle('');
      setArtist('');
      if (fileRef.current) fileRef.current.value = '';
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Upload Song</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Add a WAV file to the fingerprint library for recognition
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Drop zone ──────────────────────────────────────── */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed ${
            isDragging
              ? 'border-cyan-500/60 bg-cyan-500/[0.06] scale-[1.01]'
              : file
                ? 'border-cyan-500/30 bg-cyan-500/[0.03]'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".wav,audio/wav,audio/x-wav"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-xs">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors mt-1"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300 font-medium">
                  Drop a WAV file here or <span className="text-cyan-400">browse</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">WAV format, up to 50 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Title ──────────────────────────────────────────── */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            required
            className="input-field"
          />
        </div>

        {/* ── Artist ─────────────────────────────────────────── */}
        <div>
          <label htmlFor="artist" className="block text-sm font-medium text-gray-300 mb-1.5">
            Artist
          </label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name (optional)"
            className="input-field"
          />
        </div>

        {/* ── Submit button ──────────────────────────────────── */}
        <button
          type="submit"
          disabled={!file || !title.trim() || uploading}
          className="btn-primary w-full py-3 text-sm"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Processing &amp; Indexing...
            </span>
          ) : (
            'Upload & Index'
          )}
        </button>

        {/* ── Feedback messages ───────────────────────────────── */}
        {error && (
          <div className="glass border-red-500/20 bg-red-500/[0.06] text-red-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="glass border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 px-4 py-3 rounded-xl text-sm animate-scale-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
