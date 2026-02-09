package com.beatlens.core;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class SongMatcherTest {

    private final SongMatcher matcher = new SongMatcher();

    @Test
    void match_perfectAlignment_highConfidence() {
        // Simulate: query fingerprints and a database that returns matching entries
        // with consistent time offsets (like a real match starting at frame 100)

        List<FingerprintGenerator.Fingerprint> query = new ArrayList<>();
        Map<Long, List<SongMatcher.FingerprintEntry>> db = new HashMap<>();

        int songId = 1;
        int baseOffset = 100; // song plays from frame 100

        for (int i = 0; i < 50; i++) {
            int anchorTime = i * 5;
            long hash = (long) (i * 1000 + 42);
            query.add(new FingerprintGenerator.Fingerprint(100 + i, 200 + i, 10, anchorTime));

            // Database has matching hash at songOffset = queryAnchorTime + baseOffset
            db.put(query.get(i).hash, List.of(
                    new SongMatcher.FingerprintEntry(songId, anchorTime + baseOffset)));
        }

        SongMatcher.FingerprintLookup lookup = hash -> db.getOrDefault(hash, List.of());

        List<SongMatcher.MatchResult> results = matcher.match(query, lookup);

        assertFalse(results.isEmpty(), "Should find a match");
        assertEquals(songId, results.get(0).getSongId());
        assertTrue(results.get(0).getConfidence() > 5.0, "Confidence should be above threshold");
    }

    @Test
    void match_noMatches_returnsEmpty() {
        List<FingerprintGenerator.Fingerprint> query = List.of(
                new FingerprintGenerator.Fingerprint(100, 200, 10, 0));

        // Empty lookup — no songs in database
        SongMatcher.FingerprintLookup lookup = hash -> List.of();

        List<SongMatcher.MatchResult> results = matcher.match(query, lookup);
        assertTrue(results.isEmpty());
    }

    @Test
    void match_emptyQuery_returnsEmpty() {
        SongMatcher.FingerprintLookup lookup = hash -> List.of();
        List<SongMatcher.MatchResult> results = matcher.match(List.of(), lookup);
        assertTrue(results.isEmpty());
    }
}
