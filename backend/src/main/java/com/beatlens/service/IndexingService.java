package com.beatlens.service;

import com.beatlens.core.*;
import com.beatlens.exception.AudioProcessingException;
import com.beatlens.model.FingerprintEntity;
import com.beatlens.model.Song;
import com.beatlens.repository.FingerprintRepository;
import com.beatlens.repository.SongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the fingerprinting pipeline for song indexing:
 * audio → spectrogram → peaks → fingerprints → database.
 */
@Service
public class IndexingService {

    private static final Logger log = LoggerFactory.getLogger(IndexingService.class);

    private final AudioProcessor audioProcessor;
    private final SpectrogramGenerator spectrogramGenerator;
    private final PeakDetector peakDetector;
    private final FingerprintGenerator fingerprintGenerator;
    private final SongRepository songRepository;
    private final FingerprintRepository fingerprintRepository;
    private final FingerprintLookupService lookupService;

    public IndexingService(AudioProcessor audioProcessor,
                           SpectrogramGenerator spectrogramGenerator,
                           PeakDetector peakDetector,
                           FingerprintGenerator fingerprintGenerator,
                           SongRepository songRepository,
                           FingerprintRepository fingerprintRepository,
                           FingerprintLookupService lookupService) {
        this.audioProcessor = audioProcessor;
        this.spectrogramGenerator = spectrogramGenerator;
        this.peakDetector = peakDetector;
        this.fingerprintGenerator = fingerprintGenerator;
        this.songRepository = songRepository;
        this.fingerprintRepository = fingerprintRepository;
        this.lookupService = lookupService;
    }

    /**
     * Index a song from raw WAV bytes.
     *
     * @param title    song title
     * @param artist   artist name (nullable)
     * @param wavBytes raw WAV file bytes
     * @return the persisted Song entity
     */
    @Transactional
    public Song indexSong(String title, String artist, byte[] wavBytes) {
        log.info("Indexing song: {} - {}", title, artist);

        // 1. Decode audio
        double[] samples;
        try {
            samples = audioProcessor.readBytes(wavBytes);
        } catch (Exception e) {
            throw new AudioProcessingException("Failed to decode audio file: " + e.getMessage(), e);
        }

        if (samples.length < AudioConstants.FRAME_SIZE) {
            throw new AudioProcessingException(
                    "Audio too short: need at least " + AudioConstants.FRAME_SIZE +
                    " samples (" + String.format("%.1f", AudioConstants.FRAME_SIZE / (double) AudioConstants.SAMPLE_RATE) +
                    "s), got " + samples.length);
        }

        double durationSeconds = samples.length / (double) AudioConstants.SAMPLE_RATE;

        // 2. Generate fingerprints
        double[][] spectrogram = spectrogramGenerator.generateSpectrogram(samples);
        List<PeakDetector.Peak> peaks = peakDetector.detectPeaks(spectrogram);
        List<FingerprintGenerator.Fingerprint> fingerprints = fingerprintGenerator.generateFingerprints(peaks);

        log.info("Generated {} fingerprints for \"{}\" ({}s)",
                fingerprints.size(), title, String.format("%.1f", durationSeconds));

        // 3. Save song
        Song song = new Song();
        song.setTitle(title);
        song.setArtist(artist);
        song.setDurationSeconds(durationSeconds);
        song.setFingerprintCount(fingerprints.size());
        song = songRepository.save(song);

        // 4. Save fingerprints in batches
        final Long songId = song.getId();
        List<FingerprintEntity> entities = new ArrayList<>(fingerprints.size());
        for (FingerprintGenerator.Fingerprint fp : fingerprints) {
            entities.add(new FingerprintEntity(fp.hash, songId, fp.anchorTime));
        }

        // Batch save in chunks of 5000
        int batchSize = 5000;
        for (int i = 0; i < entities.size(); i += batchSize) {
            int end = Math.min(i + batchSize, entities.size());
            fingerprintRepository.saveAll(entities.subList(i, end));
        }

        // 5. Invalidate cache
        lookupService.invalidateCache();

        log.info("Song indexed successfully: id={}, fingerprints={}", songId, fingerprints.size());
        return song;
    }
}
