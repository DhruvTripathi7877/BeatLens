package com.beatlens.core;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PeakDetectorTest {

    private final PeakDetector detector = new PeakDetector();

    @Test
    void detectPeaks_withSyntheticSpectrogram() {
        // Create a synthetic spectrogram with a clear peak
        int numFrames = 50;
        int numBins = AudioConstants.NUM_FREQUENCY_BINS;
        double[][] spectrogram = new double[numFrames][numBins];

        // Place a strong peak at (frame=25, bin=93) (~1000 Hz)
        spectrogram[25][93] = 100.0;

        // Place another at (frame=25, bin=300) (~3228 Hz)
        spectrogram[25][300] = 80.0;

        List<PeakDetector.Peak> peaks = detector.detectPeaks(spectrogram);

        // Should find at least our two planted peaks
        assertTrue(peaks.size() >= 2, "Expected at least 2 peaks, got " + peaks.size());

        // Check the strongest peak
        PeakDetector.Peak strongest = peaks.stream()
                .max((a, b) -> Double.compare(a.magnitude, b.magnitude))
                .orElseThrow();
        assertEquals(25, strongest.frameIndex);
        assertEquals(93, strongest.frequencyBin);
    }

    @Test
    void detectPeaks_emptySpectrogram() {
        double[][] empty = new double[0][];
        List<PeakDetector.Peak> peaks = detector.detectPeaks(empty);
        assertTrue(peaks.isEmpty());
    }

    @Test
    void detectPeaks_fromRealSineWave() {
        // Generate a 440 Hz sine wave
        int sampleRate = AudioConstants.SAMPLE_RATE;
        double[] samples = new double[sampleRate]; // 1 second
        for (int i = 0; i < samples.length; i++) {
            samples[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
        }

        SpectrogramGenerator gen = new SpectrogramGenerator();
        double[][] spectrogram = gen.generateSpectrogram(samples);

        List<PeakDetector.Peak> peaks = detector.detectPeaks(spectrogram);
        assertFalse(peaks.isEmpty(), "Should detect peaks in a pure sine wave");

        // All peaks should be near 440 Hz bin (~41)
        int expectedBin = AudioConstants.frequencyToBin(440);
        boolean hasNear440 = peaks.stream()
                .anyMatch(p -> Math.abs(p.frequencyBin - expectedBin) <= 2);
        assertTrue(hasNear440, "Should detect a peak near 440 Hz");
    }
}
