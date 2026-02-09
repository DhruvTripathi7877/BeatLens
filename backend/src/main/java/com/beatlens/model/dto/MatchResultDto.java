package com.beatlens.model.dto;

/**
 * DTO returned to clients for a single match result.
 */
public record MatchResultDto(
        Long songId,
        String title,
        String artist,
        double confidence,
        int alignedMatches,
        int totalMatches,
        double timeOffsetSeconds
) {}
