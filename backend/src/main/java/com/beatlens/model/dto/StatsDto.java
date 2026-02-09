package com.beatlens.model.dto;

/**
 * DTO for the /api/stats endpoint.
 */
public record StatsDto(
        long totalSongs,
        long totalFingerprints,
        Double averageFingerprintsPerSong
) {}
