package com.beatlens.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * JPA entity for the {@code songs} table.
 */
@Entity
@Table(name = "songs")
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(length = 500)
    private String artist;

    @Column(name = "file_path", length = 1000)
    private String filePath;

    @Column(name = "duration_seconds")
    private Double durationSeconds;

    @Column(name = "fingerprint_count")
    private Integer fingerprintCount = 0;

    @Column(name = "indexed_at")
    private LocalDateTime indexedAt;

    @PrePersist
    protected void onCreate() {
        if (indexedAt == null) {
            indexedAt = LocalDateTime.now();
        }
    }

    // ═══ Getters / Setters ═══

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public Double getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Double durationSeconds) { this.durationSeconds = durationSeconds; }

    public Integer getFingerprintCount() { return fingerprintCount; }
    public void setFingerprintCount(Integer fingerprintCount) { this.fingerprintCount = fingerprintCount; }

    public LocalDateTime getIndexedAt() { return indexedAt; }
    public void setIndexedAt(LocalDateTime indexedAt) { this.indexedAt = indexedAt; }
}
