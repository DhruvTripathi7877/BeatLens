package com.beatlens.service;

import com.beatlens.core.SongMatcher;
import com.beatlens.model.FingerprintEntity;
import com.beatlens.repository.FingerprintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Bridges the core {@link SongMatcher.FingerprintLookup} interface with
 * the Spring Data repository + Caffeine cache.
 */
@Service
public class FingerprintLookupService {

    private static final Logger log = LoggerFactory.getLogger(FingerprintLookupService.class);

    private final FingerprintRepository fingerprintRepository;

    public FingerprintLookupService(FingerprintRepository fingerprintRepository) {
        this.fingerprintRepository = fingerprintRepository;
    }

    /**
     * Cached hash lookup. On cache miss, queries PostgreSQL and caches the result.
     */
    @Cacheable(value = "fingerprint-lookup", key = "#hash")
    public List<SongMatcher.FingerprintEntry> lookup(Long hash) {
        List<FingerprintEntity> entities = fingerprintRepository.findByHash(hash);
        return entities.stream()
                .map(e -> new SongMatcher.FingerprintEntry(e.getSongId(), e.getTimeOffset()))
                .collect(Collectors.toList());
    }

    /**
     * Invalidate all cached entries (called when songs are indexed or deleted).
     */
    @CacheEvict(value = "fingerprint-lookup", allEntries = true)
    public void invalidateCache() {
        log.info("Fingerprint lookup cache invalidated");
    }
}
