package com.beatlens.model.dto;

import com.beatlens.model.Song;

import java.time.LocalDateTime;

/**
 * Read-only DTO returned to clients for song information.
 */
public record SongDto(
        Long id,
        String title,
        String artist,
        Double durationSeconds,
        Integer fingerprintCount,
        LocalDateTime indexedAt
) {
    public static SongDto from(Song song) {
        return new SongDto(
                song.getId(),
                song.getTitle(),
                song.getArtist(),
                song.getDurationSeconds(),
                song.getFingerprintCount(),
                song.getIndexedAt()
        );
    }
}
