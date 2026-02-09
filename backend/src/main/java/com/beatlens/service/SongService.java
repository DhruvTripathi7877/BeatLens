package com.beatlens.service;

import com.beatlens.exception.SongNotFoundException;
import com.beatlens.model.Song;
import com.beatlens.model.dto.SongDto;
import com.beatlens.model.dto.StatsDto;
import com.beatlens.repository.FingerprintRepository;
import com.beatlens.repository.SongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Song CRUD operations and database statistics.
 */
@Service
public class SongService {

    private static final Logger log = LoggerFactory.getLogger(SongService.class);

    private final SongRepository songRepository;
    private final FingerprintRepository fingerprintRepository;
    private final FingerprintLookupService lookupService;

    public SongService(SongRepository songRepository,
                       FingerprintRepository fingerprintRepository,
                       FingerprintLookupService lookupService) {
        this.songRepository = songRepository;
        this.fingerprintRepository = fingerprintRepository;
        this.lookupService = lookupService;
    }

    public List<SongDto> listAllSongs() {
        return songRepository.findAll().stream()
                .map(SongDto::from)
                .toList();
    }

    public SongDto getSong(Long id) {
        Song song = songRepository.findById(id)
                .orElseThrow(() -> new SongNotFoundException(id));
        return SongDto.from(song);
    }

    @Transactional
    public void deleteSong(Long id) {
        if (!songRepository.existsById(id)) {
            throw new SongNotFoundException(id);
        }
        fingerprintRepository.deleteBySongId(id);
        songRepository.deleteById(id);
        lookupService.invalidateCache();
        log.info("Deleted song id={}", id);
    }

    public StatsDto getStats() {
        long totalSongs = songRepository.count();
        long totalFingerprints = fingerprintRepository.count();
        Double avg = (totalSongs > 0) ? (double) totalFingerprints / totalSongs : null;
        return new StatsDto(totalSongs, totalFingerprints, avg);
    }
}
