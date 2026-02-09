package com.beatlens.model.dto;

import java.util.List;

/**
 * Top-level response wrapper for the match endpoint.
 */
public record MatchResponse(
        List<MatchResultDto> results,
        int queryFingerprints,
        double queryDurationSeconds
) {}
