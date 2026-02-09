package com.beatlens.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Matches query fingerprints against a fingerprint store using
 * time-alignment histogram scoring.
 *
 * <p>This class is a pure-Java algorithm component. The actual fingerprint
 * lookup is delegated to a {@link FingerprintLookup} strategy so that the
 * matcher is decoupled from database / cache details.</p>
 */
public class SongMatcher {

    private static final Logger log = LoggerFactory.getLogger(SongMatcher.class);

    private final int offsetTolerance;
    private final int minAlignedMatches;
    private final double minConfidence;

    /** Strategy interface for looking up fingerprint hashes. */
    @FunctionalInterface
    public interface FingerprintLookup {
        /**
         * @param hash fingerprint hash
         * @return list of (songId, timeOffset) entries that share this hash
         */
        List<FingerprintEntry> lookup(long hash);
    }

    /** An entry from the fingerprint store. */
    public static class FingerprintEntry {
        public final long songId;
        public final int timeOffset;  // frame index in the original song

        public FingerprintEntry(long songId, int timeOffset) {
            this.songId = songId;
            this.timeOffset = timeOffset;
        }
    }

    /** Result of matching a query against one candidate song. */
    public static class MatchResult implements Comparable<MatchResult> {
        private final long songId;
        private final int alignedMatches;
        private final int totalMatches;
        private final double timeOffsetSeconds;
        private final double confidence;

        public MatchResult(long songId, int alignedMatches, int totalMatches,
                           double timeOffsetSeconds, double confidence) {
            this.songId = songId;
            this.alignedMatches = alignedMatches;
            this.totalMatches = totalMatches;
            this.timeOffsetSeconds = timeOffsetSeconds;
            this.confidence = confidence;
        }

        public long getSongId() { return songId; }
        public int getAlignedMatches() { return alignedMatches; }
        public int getTotalMatches() { return totalMatches; }
        public double getTimeOffsetSeconds() { return timeOffsetSeconds; }
        public double getConfidence() { return confidence; }

        @Override
        public int compareTo(MatchResult o) {
            return Double.compare(o.confidence, this.confidence); // descending
        }
    }

    public SongMatcher() {
        this(AudioConstants.OFFSET_TOLERANCE,
             AudioConstants.MIN_ALIGNED_MATCHES,
             AudioConstants.MIN_CONFIDENCE);
    }

    public SongMatcher(int offsetTolerance, int minAlignedMatches, double minConfidence) {
        this.offsetTolerance = offsetTolerance;
        this.minAlignedMatches = minAlignedMatches;
        this.minConfidence = minConfidence;
    }

    /**
     * Match a set of query fingerprints against the store.
     *
     * @param queryFingerprints fingerprints extracted from the query clip
     * @param lookup            strategy for hash-based lookup
     * @return ranked list of match results (best first)
     */
    public List<MatchResult> match(List<FingerprintGenerator.Fingerprint> queryFingerprints,
                                   FingerprintLookup lookup) {
        if (queryFingerprints.isEmpty()) {
            return Collections.emptyList();
        }

        // Step 1 + 2: collect matches and build per-song offset histograms
        Map<Long, SongMatchData> songMatches = collectMatches(queryFingerprints, lookup);

        // Step 3: score each candidate
        List<MatchResult> results = scoreMatches(songMatches, queryFingerprints.size());
        Collections.sort(results);

        log.debug("Matched {} query fingerprints → {} candidates",
                queryFingerprints.size(), results.size());
        return results;
    }

    // ═══ Internals ═══

    private static class SongMatchData {
        final Map<Integer, Integer> offsetHistogram = new HashMap<>();
        int totalMatches = 0;
    }

    private Map<Long, SongMatchData> collectMatches(
            List<FingerprintGenerator.Fingerprint> queryFingerprints,
            FingerprintLookup lookup) {

        Map<Long, SongMatchData> songMatches = new HashMap<>();

        for (FingerprintGenerator.Fingerprint qfp : queryFingerprints) {
            List<FingerprintEntry> entries = lookup.lookup(qfp.hash);
            if (entries == null) continue;

            for (FingerprintEntry entry : entries) {
                SongMatchData data = songMatches.computeIfAbsent(
                        entry.songId, k -> new SongMatchData());
                int offset = entry.timeOffset - qfp.anchorTime;
                int binned = (offset / offsetTolerance) * offsetTolerance;
                data.offsetHistogram.merge(binned, 1, Integer::sum);
                data.totalMatches++;
            }
        }

        return songMatches;
    }

    private List<MatchResult> scoreMatches(Map<Long, SongMatchData> songMatches,
                                            int queryFingerprintCount) {
        List<MatchResult> results = new ArrayList<>();

        for (Map.Entry<Long, SongMatchData> e : songMatches.entrySet()) {
            long songId = e.getKey();
            SongMatchData data = e.getValue();

            // Find histogram peak
            int bestOffset = 0;
            int peakCount = 0;
            for (Map.Entry<Integer, Integer> h : data.offsetHistogram.entrySet()) {
                if (h.getValue() > peakCount) {
                    peakCount = h.getValue();
                    bestOffset = h.getKey();
                }
            }

            // Count aligned matches within tolerance window around peak
            int aligned = 0;
            for (Map.Entry<Integer, Integer> h : data.offsetHistogram.entrySet()) {
                if (Math.abs(h.getKey() - bestOffset) <= offsetTolerance * 2) {
                    aligned += h.getValue();
                }
            }

            if (aligned < minAlignedMatches) continue;

            double confidence = calculateConfidence(
                    aligned, data.totalMatches, queryFingerprintCount,
                    data.offsetHistogram.size());

            if (confidence < minConfidence) continue;

            double timeOffsetSeconds = bestOffset * AudioConstants.TIME_RESOLUTION;

            results.add(new MatchResult(songId, aligned, data.totalMatches,
                    timeOffsetSeconds, confidence));
        }

        return results;
    }

    private double calculateConfidence(int alignedMatches, int totalMatches,
                                        int queryFingerprintCount, int histogramBuckets) {
        double baseScore = alignedMatches;
        double coherence = (double) alignedMatches / Math.max(1, totalMatches);
        double matchRate = (double) alignedMatches / Math.max(1, queryFingerprintCount);
        double sharpness = 1.0 / Math.max(1, Math.sqrt(histogramBuckets));

        double confidence = baseScore
                * (0.5 + 0.3 * coherence + 0.2 * matchRate)
                * (1 + sharpness);
        return Math.min(100.0, confidence / 2.0);
    }
}
