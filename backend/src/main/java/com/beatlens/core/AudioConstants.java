package com.beatlens.core;

/**
 * All audio processing constants used throughout BeatLens.
 *
 * Default values are defined here as compile-time constants.
 * Runtime-configurable values are loaded from application.yml via
 * {@link com.beatlens.config.AudioProperties} and injected where needed.
 */
public final class AudioConstants {

    private AudioConstants() {
        // utility class
    }

    // ═══ Audio Capture ═══
    public static final int SAMPLE_RATE = 44100;
    public static final int BITS_PER_SAMPLE = 16;
    public static final int BYTES_PER_SAMPLE = BITS_PER_SAMPLE / 8;
    public static final int CHANNELS = 1;

    // ═══ Spectrogram ═══
    public static final int FRAME_SIZE = 4096;
    public static final int HOP_SIZE = FRAME_SIZE / 2;
    public static final double FREQUENCY_RESOLUTION = (double) SAMPLE_RATE / FRAME_SIZE;
    public static final double TIME_RESOLUTION = (double) HOP_SIZE / SAMPLE_RATE;
    public static final int NUM_FREQUENCY_BINS = FRAME_SIZE / 2;
    public static final double MAX_FREQUENCY = SAMPLE_RATE / 2.0;

    // ═══ Peak Detection ═══
    public static final int[] FREQUENCY_BANDS = {0, 300, 600, 1200, 2400, 5000};
    public static final int PEAKS_PER_FRAME = 5;
    public static final int PEAK_NEIGHBORHOOD_SIZE = 20;
    public static final double PEAK_MIN_AMPLITUDE = 0.01;

    // ═══ Fingerprint Generation ═══
    public static final int TARGET_ZONE_SIZE = 5;
    public static final int FAN_OUT = 15;
    public static final int MAX_TIME_DELTA = 200;

    // ═══ Matching ═══
    public static final int OFFSET_TOLERANCE = 2;
    public static final int MIN_ALIGNED_MATCHES = 3;
    public static final double MIN_CONFIDENCE = 5.0;

    // ═══ Utility methods ═══

    /** Convert frequency (Hz) to FFT bin index. */
    public static int frequencyToBin(double frequency) {
        return (int) Math.round(frequency / FREQUENCY_RESOLUTION);
    }

    /** Convert FFT bin index to frequency (Hz). */
    public static double binToFrequency(int bin) {
        return bin * FREQUENCY_RESOLUTION;
    }
}
