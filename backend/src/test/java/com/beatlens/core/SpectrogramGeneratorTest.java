package com.beatlens.core;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SpectrogramGeneratorTest {

    private final SpectrogramGenerator generator = new SpectrogramGenerator();

    @Test
    void generateSpectrogram_withSineWave_producesPeakAtCorrectBin() {
        // Generate a 1000 Hz sine wave, 1 second
        int sampleRate = AudioConstants.SAMPLE_RATE;
        double freq = 1000.0;
        double[] samples = new double[sampleRate]; // 1 second

        for (int i = 0; i < samples.length; i++) {
            samples[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
        }

        double[][] spectrogram = generator.generateSpectrogram(samples);

        // Should have multiple frames
        int expectedFrames = generator.calculateNumFrames(samples.length);
        assertEquals(expectedFrames, spectrogram.length);
        assertTrue(expectedFrames > 0);

        // Each frame should have FRAME_SIZE/2 bins
        assertEquals(AudioConstants.FRAME_SIZE / 2, spectrogram[0].length);

        // Find the peak bin in the middle frame
        int midFrame = spectrogram.length / 2;
        int peakBin = 0;
        double peakVal = 0;
        for (int b = 0; b < spectrogram[midFrame].length; b++) {
            if (spectrogram[midFrame][b] > peakVal) {
                peakVal = spectrogram[midFrame][b];
                peakBin = b;
            }
        }

        // The peak should be near the bin for 1000 Hz
        int expectedBin = AudioConstants.frequencyToBin(freq);
        assertEquals(expectedBin, peakBin, 2, "Peak should be at ~1000 Hz bin");
    }

    @Test
    void generateSpectrogram_tooShortAudio_throws() {
        double[] tooShort = new double[100];
        assertThrows(IllegalArgumentException.class, () -> generator.generateSpectrogram(tooShort));
    }

    @Test
    void calculateNumFrames_formula() {
        int numSamples = 44100; // 1 second
        int expected = (numSamples - AudioConstants.FRAME_SIZE) / AudioConstants.HOP_SIZE + 1;
        assertEquals(expected, generator.calculateNumFrames(numSamples));
    }

    @Test
    void constructor_nonPowerOfTwo_throws() {
        assertThrows(IllegalArgumentException.class, () -> new SpectrogramGenerator(4097, 2048));
    }
}
