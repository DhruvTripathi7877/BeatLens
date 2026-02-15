package com.beatlens.core;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FingerprintGeneratorTest {

    private final FingerprintGenerator generator = new FingerprintGenerator();

    @Test
    void generateFingerprints_fromPeaks() {
        // Create a sequence of peaks at different times
        List<PeakDetector.Peak> peaks = Arrays.asList(
                new PeakDetector.Peak(0, 100, 50.0),
                new PeakDetector.Peak(10, 200, 45.0),
                new PeakDetector.Peak(20, 150, 55.0),
                new PeakDetector.Peak(30, 250, 40.0)
        );

        List<FingerprintGenerator.Fingerprint> fingerprints = generator.generateFingerprints(peaks);

        assertFalse(fingerprints.isEmpty());

        // Check that all fingerprints have valid hash values
        for (FingerprintGenerator.Fingerprint fp : fingerprints) {
            assertTrue(fp.hash >= 0, "Hash should be non-negative");
            assertTrue(fp.timeDelta >= AudioConstants.TARGET_ZONE_SIZE,
                    "Time delta should be >= target zone size");
        }
    }

    @Test
    void generateFingerprints_emptyPeaks() {
        List<FingerprintGenerator.Fingerprint> fps = generator.generateFingerprints(List.of());
        assertTrue(fps.isEmpty());
    }

    @Test
    void hashFormula_encodes12BitFrequenciesAnd10BitTimeDelta() {
        // Test with frequency bins >1023 to verify no modulo wrap for current FFT bins.
        FingerprintGenerator.Fingerprint fp = new FingerprintGenerator.Fingerprint(
                2000, 1500, 100, 0);

        // freq1/freq2 use 12-bit fields, timeDelta uses 10 bits.
        long expected = ((long) (2000 & 0xFFF) << 22)
                | ((long) (1500 & 0xFFF) << 10)
                | (100 & 0x3FF);
        assertEquals(expected, fp.hash);
        assertTrue(fp.hash >= 0, "Hash should be non-negative");
    }

    @Test
    void generateFingerprints_respectsMaxTimeDelta() {
        // Peaks too far apart should not be paired
        List<PeakDetector.Peak> peaks = Arrays.asList(
                new PeakDetector.Peak(0, 100, 50.0),
                new PeakDetector.Peak(300, 200, 45.0)  // 300 frames apart > MAX_TIME_DELTA (200)
        );

        List<FingerprintGenerator.Fingerprint> fingerprints = generator.generateFingerprints(peaks);
        assertTrue(fingerprints.isEmpty(), "Peaks beyond MAX_TIME_DELTA should not be paired");
    }
}
