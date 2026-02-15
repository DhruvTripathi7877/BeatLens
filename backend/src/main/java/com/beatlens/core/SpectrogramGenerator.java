package com.beatlens.core;

import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.transform.DftNormalization;
import org.apache.commons.math3.transform.FastFourierTransformer;
import org.apache.commons.math3.transform.TransformType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Converts raw audio samples into a spectrogram (time-frequency magnitude matrix).
 *
 * <p>Pipeline: framing → Hann windowing → FFT (Apache Commons Math) →
 * log-magnitude extraction.</p>
 *
 * <h3>Robustness techniques</h3>
 * <ul>
 *   <li><b>Log-magnitude</b>: Compresses dynamic range so quiet sections
 *       (e.g. song tail / fade-out) produce magnitudes comparable to loud sections.
 *       Without this, a global-max threshold during indexing of a full song
 *       suppresses peaks in quiet regions, causing those sections to be
 *       unrecognisable when queried in isolation.</li>
 * </ul>
 *
 * <h3>Why no spectral whitening?</h3>
 * <p>An earlier version subtracted the per-frequency-bin temporal mean to flatten
 * the spectral envelope. This was <b>removed</b> because the mean depends on the
 * <em>entire clip being processed</em>. During indexing the mean is computed across
 * the full 3-minute song, while during matching it is computed across a short query
 * clip — producing completely different values and therefore different peaks and
 * hashes. The log-magnitude plus the local-maximum neighbourhood check in
 * {@link PeakDetector} already handle spectral envelope differences robustly:
 * log compresses multiplicative coloring to a small additive shift, and the
 * local-max check is invariant to shifts that affect all neighbours equally.</p>
 */
public class SpectrogramGenerator {

    private static final Logger log = LoggerFactory.getLogger(SpectrogramGenerator.class);

    private final int frameSize;
    private final int hopSize;
    private final double[] hannWindow;
    private final FastFourierTransformer fft;

    public SpectrogramGenerator() {
        this(AudioConstants.FRAME_SIZE, AudioConstants.HOP_SIZE);
    }

    public SpectrogramGenerator(int frameSize, int hopSize) {
        if ((frameSize & (frameSize - 1)) != 0) {
            throw new IllegalArgumentException("Frame size must be a power of 2, got " + frameSize);
        }
        this.frameSize = frameSize;
        this.hopSize = hopSize;
        this.hannWindow = computeHannWindow(frameSize);
        this.fft = new FastFourierTransformer(DftNormalization.STANDARD);
    }

    // ═══ Main public method ═══

    /**
     * Generate a log-magnitude spectrogram.
     *
     * @param samples normalised audio samples [-1.0, 1.0]
     * @return {@code double[numFrames][frameSize/2]} — log-magnitude values
     */
    public double[][] generateSpectrogram(double[] samples) {
        int numFrames = calculateNumFrames(samples.length);
        if (numFrames <= 0) {
            throw new IllegalArgumentException(
                    "Audio too short: need at least " + frameSize + " samples, got " + samples.length);
        }

        double[][] spectrogram = new double[numFrames][frameSize / 2];

        for (int frame = 0; frame < numFrames; frame++) {
            int start = frame * hopSize;
            double[] windowed = extractAndWindow(samples, start);
            spectrogram[frame] = computeFFTMagnitude(windowed);
        }

        log.debug("Generated spectrogram: {} frames x {} bins (log-magnitude)",
                numFrames, frameSize / 2);
        return spectrogram;
    }

    // ═══ Utility ═══

    public int getFrameSize() {
        return frameSize;
    }

    public int getHopSize() {
        return hopSize;
    }

    public int calculateNumFrames(int numSamples) {
        return Math.max(0, (numSamples - frameSize) / hopSize + 1);
    }

    public double frameToTime(int frameIndex) {
        return (double) (frameIndex * hopSize) / AudioConstants.SAMPLE_RATE;
    }

    // ═══ Internals ═══

    private double[] extractAndWindow(double[] samples, int start) {
        double[] frame = new double[frameSize];
        for (int i = 0; i < frameSize; i++) {
            int idx = start + i;
            frame[i] = (idx < samples.length) ? samples[idx] * hannWindow[i] : 0.0;
        }
        return frame;
    }

    private double[] computeFFTMagnitude(double[] windowed) {
        Complex[] spectrum = fft.transform(windowed, TransformType.FORWARD);
        double[] magnitudes = new double[frameSize / 2];
        for (int i = 0; i < magnitudes.length; i++) {
            // Log-magnitude: log(1 + |X|) compresses dynamic range.
            // A loud section (mag ~50000) maps to ~10.8 while a quiet section
            // (mag ~500) maps to ~6.2 — a 100:1 ratio becomes ~1.7:1.
            // This ensures quiet regions (song tails, fade-outs) still produce
            // meaningful peaks during both indexing and query.
            magnitudes[i] = Math.log1p(spectrum[i].abs());
        }
        return magnitudes;
    }

    private static double[] computeHannWindow(int size) {
        double[] w = new double[size];
        for (int i = 0; i < size; i++) {
            w[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i / (size - 1)));
        }
        return w;
    }
}
