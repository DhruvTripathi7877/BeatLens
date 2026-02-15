import { useCallback, useRef, useState } from 'react';

export interface AudioRecorderState {
  /** Whether we're currently recording. */
  isRecording: boolean;
  /** Duration of the current/last recording in seconds. */
  duration: number;
  /** Any error that occurred. */
  error: string | null;
  /** AnalyserNode for real-time audio visualization (available only while recording). */
  analyserNode: AnalyserNode | null;
}

export interface AudioRecorderActions {
  /** Start recording from the microphone. */
  startRecording: () => Promise<void>;
  /** Stop recording and return the WAV Blob. */
  stopRecording: () => Promise<Blob | null>;
}

/**
 * Hook that wraps the Web Audio API to record microphone input and
 * produce a WAV Blob for upload to the backend.
 *
 * Also creates an AnalyserNode that can drive a real-time audio
 * visualizer while recording is active.
 */
export function useAudioRecorder(): [AudioRecorderState, AudioRecorderActions] {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setDuration(0);

    try {
      // Disable browser voice-processing features that can suppress music.
      // Echo cancellation / noise suppression / AGC are useful for calls, but
      // they distort or remove speaker-played songs (e.g. YouTube capture).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      // ── Audio analyser for real-time visualization ──────────────
      // The AnalyserNode taps the live mic stream without affecting
      // the MediaRecorder path. It provides frequency-domain data
      // that the AudioVisualizer canvas reads each animation frame.
      const audioCtx = new AudioContext({ sampleRate: 44100 });
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;              // 128 frequency bins – plenty for visualization
      analyser.smoothingTimeConstant = 0.8; // smooth transitions between frames
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      setAnalyserNode(analyser);

      // ── MediaRecorder for audio capture ────────────────────────
      const preferredMime = 'audio/webm;codecs=opus';
      const fallbackMime = 'audio/webm';
      const mimeType = MediaRecorder.isTypeSupported(preferredMime) ? preferredMime : fallbackMime;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Clean up timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Clean up audio analyser context
        if (audioContextRef.current) {
          await audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setAnalyserNode(null);

        // Convert to WAV via AudioContext
        const webmBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const wavBlob = await webmToWav(webmBlob);
          resolveRef.current?.(wavBlob);
        } catch {
          // Keep client errors generic and avoid sending mislabeled formats.
          setError('Failed to process recorded audio. Please try again.');
          resolveRef.current?.(null);
        }
      };

      recorder.start(250); // collect chunks every 250ms
      startTimeRef.current = Date.now();
      setIsRecording(true);

      // Update duration display
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(msg);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.stop();
      setIsRecording(false);

      // Stop all tracks on the media stream
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    });
  }, []);

  return [
    { isRecording, duration, error, analyserNode },
    { startRecording, stopRecording },
  ];
}

// ─────────────────────────────────────────────────────────────────
// WAV encoding utilities
// ─────────────────────────────────────────────────────────────────

/**
 * Convert a WebM audio blob to a WAV blob via the Web Audio API.
 */
async function webmToWav(webmBlob: Blob): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 44100 });

  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    // Take channel 0 (mono)
    const samples = audioBuffer.getChannelData(0);
    return encodeWav(samples, audioBuffer.sampleRate);
  } finally {
    await ctx.close();
  }
}

/**
 * Encode Float32 samples as a 16-bit PCM WAV blob.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);        // chunk size
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);        // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
