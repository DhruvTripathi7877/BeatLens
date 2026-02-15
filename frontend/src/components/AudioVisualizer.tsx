import { useRef, useEffect } from 'react';

interface Props {
  /** The Web Audio AnalyserNode that provides frequency data (null when not recording). */
  analyserNode: AnalyserNode | null;
  /** Whether the microphone is actively recording. */
  isRecording: boolean;
  /** Whether a match query is in flight. */
  isMatching?: boolean;
  /** Canvas size in CSS pixels (square). Defaults to 280. */
  size?: number;
}

/**
 * A circular frequency-bar visualizer drawn on a <canvas>.
 *
 * Three visual states:
 *  1. **Idle** – subtle breathing ring of short bars (ambient motion)
 *  2. **Recording** – bars respond to live microphone frequency data
 *  3. **Matching** – rotating wave animation while the backend processes audio
 *
 * The component uses `requestAnimationFrame` to paint at screen refresh
 * rate without triggering React re-renders each frame.
 */
export default function AudioVisualizer({
  analyserNode,
  isRecording,
  isMatching = false,
  size = 280,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI (Retina) displays: canvas buffer is scaled up
    // while CSS dimensions stay the same, producing crisp lines.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const innerRadius = 86;   // just outside the 80px-radius listen button
    const barCount = 72;
    const maxBarHeight = 36;

    // ── Render loop ──────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      if (analyserNode && isRecording) {
        // ── State: Recording ────────────────────────────────────
        // Read real frequency data from the microphone stream.
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          // Map each bar to the lower ~75% of the spectrum (where
          // most musical content lives) for a more responsive feel.
          const dataIndex = Math.floor((i / barCount) * bufferLength * 0.75);
          const value = dataArray[dataIndex] / 255;
          const barHeight = Math.max(3, value * maxBarHeight);

          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x1 = centerX + cos * innerRadius;
          const y1 = centerY + sin * innerRadius;
          const x2 = centerX + cos * (innerRadius + barHeight);
          const y2 = centerY + sin * (innerRadius + barHeight);

          // Hue shifts from teal (170°) to cyan (195°) around the ring.
          const hue = 170 + (i / barCount) * 25;
          const alpha = 0.45 + value * 0.55;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      } else if (isMatching) {
        // ── State: Matching (analysing query on server) ─────────
        // Rotating wave pattern to convey "processing".
        const time = Date.now() / 1000;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2 + time * 2;
          const wave = Math.sin(time * 3 + i * 0.2) * 0.5 + 0.5;
          const barHeight = 3 + wave * 18;

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x1 = centerX + cos * innerRadius;
          const y1 = centerY + sin * innerRadius;
          const x2 = centerX + cos * (innerRadius + barHeight);
          const y2 = centerY + sin * (innerRadius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(180, 70%, 55%, ${0.25 + wave * 0.45})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      } else {
        // ── State: Idle (breathing ring) ────────────────────────
        // A slow sine-wave pattern creates subtle ambient motion,
        // signaling that the app is alive and ready.
        const time = Date.now() / 1000;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
          const breathe = Math.sin(time * 1.5 + i * 0.12) * 0.5 + 0.5;
          const barHeight = 2 + breathe * 5;

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x1 = centerX + cos * innerRadius;
          const y1 = centerY + sin * innerRadius;
          const x2 = centerX + cos * (innerRadius + barHeight);
          const y2 = centerY + sin * (innerRadius + barHeight);

          const hue = 170 + (i / barCount) * 20;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `hsla(${hue}, 60%, 50%, ${0.08 + breathe * 0.14})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isRecording, isMatching, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="absolute inset-0 pointer-events-none"
    />
  );
}
