import { useEffect, useState } from 'react';

const steps = [
  {
    step: '01',
    name: 'RECORD',
    desc: 'microphone captures raw audio at full sample rate',
  },
  {
    step: '02',
    name: 'SPECTROGRAM',
    desc: 'hann-windowed FFT · 4096-sample frames · 50% overlap',
  },
  {
    step: '03',
    name: 'PEAK DETECTION',
    desc: 'local maxima across 5 frequency bands (0–5000 Hz)',
  },
  {
    step: '04',
    name: 'FINGERPRINTING',
    desc: 'anchor-target pairs hashed as freq1 · freq2 · Δt',
  },
  {
    step: '05',
    name: 'MATCHING',
    desc: 'time-alignment histogram scoring against the library',
  },
];

export default function AlgorithmPipeline() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const step = steps[current];

  return (
    <div className="w-full max-w-lg mx-auto mt-4">
      <div className="terminal-box px-4 py-4">
        <p className="font-mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
          // how it works
        </p>

        {/* Animated step — key remount triggers slide-in animation */}
        <div key={current} className="animate-slide-in overflow-hidden">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs text-zinc-600 tabular-nums">
              [{step.step}/05]
            </span>
            <span className="font-mono text-xs text-green-400">
              {step.name}
            </span>
            <span className="font-mono text-xs text-zinc-500">
              — {step.desc}
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((_, i) => (
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
      </div>
    </div>
  );
}
