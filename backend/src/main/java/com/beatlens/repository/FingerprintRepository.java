package com.beatlens.repository;

import com.beatlens.model.FingerprintEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FingerprintRepository extends JpaRepository<FingerprintEntity, Long> {

    /**
     * Find all fingerprint entries that share the given hash value.
     * Used during matching to look up candidates.
     */
    List<FingerprintEntity> findByHash(Long hash);

    /**
     * Delete all fingerprints belonging to a song (faster than cascade in bulk).
     */
    @Modifying
    @Query("DELETE FROM FingerprintEntity f WHERE f.songId = :songId")
    void deleteBySongId(@Param("songId") Long songId);

    /**
     * Count fingerprints for a given song.
     */
    long countBySongId(Long songId);
}
