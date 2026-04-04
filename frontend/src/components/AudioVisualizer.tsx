import { useRef, useEffect } from 'react';

interface Props {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  isMatching?: boolean;
}

export default function AudioVisualizer({
  analyserNode,
  isRecording,
  isMatching = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const barWidth = 3;
    const gap = 1;

    const resize = () => {
      const cssWidth = canvas.offsetWidth;
      canvas.width = cssWidth * dpr;
      canvas.height = 64 * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();

    const draw = () => {
      const cssWidth = canvas.offsetWidth;
      const canvasH = 64;
      ctx.clearRect(0, 0, cssWidth, canvasH);

      const barCount = Math.floor(cssWidth / (barWidth + gap));

      if (analyserNode && isRecording) {
        // ── Recording: real frequency data ──────────────────────
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength * 0.75);
          const value = dataArray[dataIndex] / 255;
          const barHeight = Math.max(2, value * canvasH);
          const x = i * (barWidth + gap);
          const alpha = 0.5 + value * 0.5;
          ctx.fillStyle = `hsla(142, 70%, 55%, ${alpha})`;
          ctx.fillRect(x, canvasH - barHeight, barWidth, barHeight);
        }
      } else if (isMatching) {
        // ── Matching: scanning shimmer ───────────────────────────
        const time = Date.now() / 1000;
        for (let i = 0; i < barCount; i++) {
          const wave = Math.sin(time * 3 + i * 0.15 - time * 2) * 0.5 + 0.5;
          const barHeight = 2 + wave * (canvasH * 0.6);
          const x = i * (barWidth + gap);
          const alpha = 0.2 + wave * 0.35;
          ctx.fillStyle = `hsla(142, 50%, 40%, ${alpha})`;
          ctx.fillRect(x, canvasH - barHeight, barWidth, barHeight);
        }
      } else {
        // ── Idle: slow breathing ─────────────────────────────────
        const time = Date.now() / 1000;
        for (let i = 0; i < barCount; i++) {
          const breathe = Math.sin(time * 1.2 + i * 0.18) * 0.5 + 0.5;
          const barHeight = 2 + breathe * 8;
          const x = i * (barWidth + gap);
          const alpha = 0.12 + breathe * 0.16;
          ctx.fillStyle = `hsla(142, 50%, 40%, ${alpha})`;
          ctx.fillRect(x, canvasH - barHeight, barWidth, barHeight);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserNode, isRecording, isMatching]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '64px' }}
      className="block pointer-events-none"
    />
  );
}
