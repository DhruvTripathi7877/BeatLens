package com.beatlens.core;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AudioProcessorTest {

    @Test
    void bytesToSamples_roundTrip() {
        double[] original = {0.0, 0.5, -0.5, 1.0, -1.0};
        byte[] bytes = AudioProcessor.samplesToBytes(original);
        double[] recovered = AudioProcessor.bytesToSamples(bytes);

        assertEquals(original.length, recovered.length);
        for (int i = 0; i < original.length; i++) {
            assertEquals(original[i], recovered[i], 0.001,
                    "Sample " + i + " should survive round-trip");
        }
    }

    @Test
    void bytesToSamples_normalization() {
        // Max positive: 0x7FFF = 32767 → ~1.0
        byte[] maxPositive = {(byte) 0xFF, (byte) 0x7F}; // LE
        double[] samples = AudioProcessor.bytesToSamples(maxPositive);
        assertEquals(1, samples.length);
        assertTrue(samples[0] > 0.99 && samples[0] <= 1.0);

        // Max negative: 0x8000 = -32768 → -1.0
        byte[] maxNegative = {0x00, (byte) 0x80}; // LE
        samples = AudioProcessor.bytesToSamples(maxNegative);
        assertEquals(-1.0, samples[0], 0.001);
    }

    @Test
    void samplesToBytes_clipsOutOfRange() {
        double[] outOfRange = {2.0, -3.0};
        byte[] bytes = AudioProcessor.samplesToBytes(outOfRange);
        double[] recovered = AudioProcessor.bytesToSamples(bytes);

        // Should be clipped to [-1, 1]
        assertTrue(recovered[0] <= 1.0 && recovered[0] >= 0.99);
        assertTrue(recovered[1] >= -1.0 && recovered[1] <= -0.99);
    }
}
