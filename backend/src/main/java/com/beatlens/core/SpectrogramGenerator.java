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
 * <p>Pipeline: framing → Hann windowing → FFT (Apache Commons Math) → magnitude extraction.</p>
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
     * Generate a magnitude spectrogram.
     *
     * @param samples normalised audio samples [-1.0, 1.0]
     * @return {@code double[numFrames][frameSize/2]} magnitude values
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

        log.debug("Generated spectrogram: {} frames x {} bins", numFrames, frameSize / 2);
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
            magnitudes[i] = spectrum[i].abs(); // sqrt(re^2 + im^2)
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
