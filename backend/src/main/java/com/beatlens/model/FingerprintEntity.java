package com.beatlens.model;

import jakarta.persistence.*;

/**
 * JPA entity for the {@code fingerprints} table.
 *
 * Named {@code FingerprintEntity} to avoid confusion with the core
 * {@link com.beatlens.core.FingerprintGenerator.Fingerprint} value class.
 */
@Entity
@Table(name = "fingerprints", indexes = {
        @Index(name = "idx_fingerprints_hash", columnList = "hash"),
        @Index(name = "idx_fingerprints_song_id", columnList = "song_id")
})
public class FingerprintEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long hash;

    @Column(name = "song_id", nullable = false)
    private Long songId;

    @Column(name = "time_offset", nullable = false)
    private Integer timeOffset;

    public FingerprintEntity() {}

    public FingerprintEntity(Long hash, Long songId, Integer timeOffset) {
        this.hash = hash;
        this.songId = songId;
        this.timeOffset = timeOffset;
    }

    // ═══ Getters / Setters ═══

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHash() { return hash; }
    public void setHash(Long hash) { this.hash = hash; }

    public Long getSongId() { return songId; }
    public void setSongId(Long songId) { this.songId = songId; }

    public Integer getTimeOffset() { return timeOffset; }
    public void setTimeOffset(Integer timeOffset) { this.timeOffset = timeOffset; }
}
