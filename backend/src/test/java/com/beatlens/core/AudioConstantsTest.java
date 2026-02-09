package com.beatlens.core;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AudioConstantsTest {

    @Test
    void frequencyToBinAndBack() {
        // 1000 Hz should map to bin ~93 (1000 / 10.77 ≈ 92.9)
        int bin = AudioConstants.frequencyToBin(1000);
        assertEquals(93, bin);

        // And back
        double freq = AudioConstants.binToFrequency(bin);
        assertEquals(1000.0, freq, 15.0); // within one frequency resolution
    }

    @Test
    void derivedConstantsAreConsistent() {
        assertEquals(AudioConstants.FRAME_SIZE / 2, AudioConstants.NUM_FREQUENCY_BINS);
        assertEquals(AudioConstants.SAMPLE_RATE / 2.0, AudioConstants.MAX_FREQUENCY);
        assertEquals(AudioConstants.FRAME_SIZE / 2, AudioConstants.HOP_SIZE);
    }

    @Test
    void frequencyResolutionIsCorrect() {
        double expected = (double) AudioConstants.SAMPLE_RATE / AudioConstants.FRAME_SIZE;
        assertEquals(expected, AudioConstants.FREQUENCY_RESOLUTION, 0.001);
    }
}
