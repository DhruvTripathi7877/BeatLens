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
        if (!title) setTitle(dropped.name.replace(/\.\w+$/, ''));
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
    if (selected && !title) setTitle(selected.name.replace(/\.\w+$/, ''));
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
        `"${song.title}" indexed with ${song.fingerprintCount.toLocaleString()} fingerprints`,
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
      <p className="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4">// UPLOAD</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`border rounded-none p-6 cursor-pointer font-mono text-sm transition-colors duration-150 ${
            isDragging
              ? 'border-green-400/40 bg-green-400/[0.04]'
              : file
                ? 'border-green-400/20 bg-green-400/[0.03]'
                : 'border-white/10 bg-zinc-950 hover:border-white/[0.18]'
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400 truncate">
                <span className="text-zinc-600">[{file.name.split('.').pop()?.toLowerCase() ?? 'audio'}]</span>{'  '}{file.name}{'  '}
                <span className="text-zinc-600">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
              >
                [remove]
              </button>
            </div>
          ) : (
            <p className="text-zinc-500">
              {'> drop audio file here or '}
              <span className="text-green-400">[browse]</span>
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="terminal-label">
            Title <span className="text-zinc-700 normal-case tracking-normal">(required)</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="song title"
            required
            className="terminal-input"
          />
        </div>

        {/* Artist */}
        <div>
          <label htmlFor="artist" className="terminal-label">Artist</label>
          <input
            id="artist"
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="artist name (optional)"
            className="terminal-input"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || !title.trim() || uploading}
          className="btn-terminal-accent w-full py-3 text-sm"
        >
          {uploading ? (
            <>{'> processing...'}<span className="animate-blink">_</span></>
          ) : (
            '> upload & index'
          )}
        </button>

        {/* Feedback */}
        {error && (
          <p className="font-mono text-xs text-red-400 animate-scale-in">
            [ERR] {error}
          </p>
        )}
        {success && (
          <div className="terminal-box border-green-400/20 bg-green-400/[0.06] px-4 py-2 animate-scale-in">
            <p className="font-mono text-xs text-green-400">[ok] {success}</p>
          </div>
        )}
      </form>
    </div>
  );
}
