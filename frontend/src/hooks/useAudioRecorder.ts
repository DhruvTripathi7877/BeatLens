import { useCallback, useRef, useState } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  error: string | null;
  analyserNode: AnalyserNode | null;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  /** Stop recording and return the raw audio Blob (WebM/Opus). */
  stopRecording: () => Promise<Blob | null>;
}

/**
 * Hook that wraps the Web Audio API to record microphone input.
 *
 * Returns the raw WebM/Opus blob from MediaRecorder — no encoding or
 * conversion happens here. The backend decodes via FFmpeg.
 *
 * Also creates an AnalyserNode for real-time visualization.
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      mediaStreamRef.current = stream;
      chunksRef.current = [];

      // AnalyserNode for visualization only — does not affect recorded data
      const audioCtx = new AudioContext({ sampleRate: 44100 });
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      setAnalyserNode(analyser);

      const preferredMime = 'audio/webm;codecs=opus';
      const mimeType = MediaRecorder.isTypeSupported(preferredMime)
        ? preferredMime
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (audioContextRef.current) {
          await audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        setAnalyserNode(null);

        // Return the raw WebM blob — backend handles decoding
        const blob = new Blob(chunksRef.current, { type: mimeType });
        resolveRef.current?.(blob);
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setIsRecording(true);

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
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    });
  }, []);

  return [
    { isRecording, duration, error, analyserNode },
    { startRecording, stopRecording },
  ];
}
