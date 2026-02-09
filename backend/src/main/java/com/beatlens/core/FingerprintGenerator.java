package com.beatlens.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;

/**
 * Creates audio fingerprints by pairing peaks in the constellation map.
 *
 * <p>Each fingerprint is a hash of (anchorFreq, targetFreq, timeDelta) plus
 * the anchor's time position for later time-alignment matching.</p>
 *
 * <h3>Hash formula</h3>
 * <pre>hash = (freq1 &amp; 0x3FF) &lt;&lt; 20 | (freq2 &amp; 0x3FF) &lt;&lt; 10 | (timeDelta &amp; 0x3FF)</pre>
 * <p>Frequency bins and time deltas are masked to 10 bits (0-1023) to prevent overflow.</p>
 */
public class FingerprintGenerator {

    private static final Logger log = LoggerFactory.getLogger(FingerprintGenerator.class);

    private final int targetZoneSize;
    private final int fanOut;
    private final int maxTimeDelta;

    /** A single audio fingerprint: a hash plus anchor time. */
    public static class Fingerprint {
        public final long hash;
        public final int anchorTime;   // frame index of anchor peak
        public final int freq1;
        public final int freq2;
        public final int timeDelta;

        public Fingerprint(int freq1, int freq2, int timeDelta, int anchorTime) {
            this.freq1 = freq1;
            this.freq2 = freq2;
            this.timeDelta = timeDelta;
            this.anchorTime = anchorTime;
            // Mask to 10 bits each to prevent overflow in the 30-bit hash
            this.hash = ((long) (freq1 & 0x3FF) << 20)
                      | ((long) (freq2 & 0x3FF) << 10)
                      | (timeDelta & 0x3FF);
        }
    }

    public FingerprintGenerator() {
        this(AudioConstants.TARGET_ZONE_SIZE, AudioConstants.FAN_OUT, AudioConstants.MAX_TIME_DELTA);
    }

    public FingerprintGenerator(int targetZoneSize, int fanOut, int maxTimeDelta) {
        this.targetZoneSize = targetZoneSize;
        this.fanOut = fanOut;
        this.maxTimeDelta = maxTimeDelta;
    }

    /**
     * Generate fingerprints from a list of spectrogram peaks.
     *
     * @param peaks detected peaks (from {@link PeakDetector})
     * @return list of fingerprints
     */
    public List<Fingerprint> generateFingerprints(List<PeakDetector.Peak> peaks) {
        List<Fingerprint> fingerprints = new ArrayList<>();
        if (peaks.isEmpty()) return fingerprints;

        // Sort by time (frame index)
        List<PeakDetector.Peak> sorted = new ArrayList<>(peaks);
        sorted.sort((a, b) -> Integer.compare(a.frameIndex, b.frameIndex));

        for (int i = 0; i < sorted.size(); i++) {
            PeakDetector.Peak anchor = sorted.get(i);
            int paired = 0;

            for (int j = i + 1; j < sorted.size() && paired < fanOut; j++) {
                PeakDetector.Peak target = sorted.get(j);
                int dt = target.frameIndex - anchor.frameIndex;

                if (dt < targetZoneSize) continue;
                if (dt > maxTimeDelta) break;

                fingerprints.add(new Fingerprint(
                        anchor.frequencyBin, target.frequencyBin, dt, anchor.frameIndex));
                paired++;
            }
        }

        log.debug("Generated {} fingerprints from {} peaks", fingerprints.size(), peaks.size());
        return fingerprints;
    }
}
