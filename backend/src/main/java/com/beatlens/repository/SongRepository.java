package com.beatlens.repository;

import com.beatlens.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    @Query(value = "SELECT * FROM songs ORDER BY id OFFSET :offset LIMIT :limit", nativeQuery = true)
    List<Song> findWithOffset(@Param("offset") long offset, @Param("limit") int limit);
}
