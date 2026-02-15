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
    // 7 bands (up from 5) — now covers the FULL spectrum up to Nyquist.
    // The old {0..5000} ignored 77 % of frequency bins (5–22 kHz) where
    // many discriminative features live, especially for compressed audio.
    public static final int[] FREQUENCY_BANDS = {0, 300, 600, 1200, 2400, 5000, 10000, 22050};
    // More peaks per frame (8 vs 5) to match the extra bands and provide
    // denser constellation maps for better matching of degraded audio.
    public static final int PEAKS_PER_FRAME = 8;
    // Slightly smaller neighborhood (15 vs 20) increases peak density,
    // giving more fingerprints and improving recall on lossy recordings.
    public static final int PEAK_NEIGHBORHOOD_SIZE = 15;
    public static final double PEAK_MIN_AMPLITUDE = 0.01;

    // ═══ Fingerprint Generation ═══
    public static final int TARGET_ZONE_SIZE = 5;
    // Higher fan-out (20 vs 15) creates more redundant fingerprints per
    // anchor, so matches can still succeed when some hashes are lost to
    // compression artifacts or environmental noise.
    public static final int FAN_OUT = 20;
    public static final int MAX_TIME_DELTA = 200;

    // ═══ Matching ═══
    // Wider tolerance (3 vs 2) absorbs slight timing jitter introduced by
    // lossy codecs and microphone capture.
    public static final int OFFSET_TOLERANCE = 3;
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
