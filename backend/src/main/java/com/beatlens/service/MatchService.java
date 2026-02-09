package com.beatlens.service;

import com.beatlens.core.*;
import com.beatlens.exception.AudioProcessingException;
import com.beatlens.model.Song;
import com.beatlens.model.dto.MatchResponse;
import com.beatlens.model.dto.MatchResultDto;
import com.beatlens.repository.SongRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Orchestrates the matching pipeline:
 * query audio → fingerprints → hash lookup → time-alignment scoring.
 */
@Service
public class MatchService {

    private static final Logger log = LoggerFactory.getLogger(MatchService.class);

    private final AudioProcessor audioProcessor;
    private final SpectrogramGenerator spectrogramGenerator;
    private final PeakDetector peakDetector;
    private final FingerprintGenerator fingerprintGenerator;
    private final SongMatcher songMatcher;
    private final FingerprintLookupService lookupService;
    private final SongRepository songRepository;

    public MatchService(AudioProcessor audioProcessor,
                        SpectrogramGenerator spectrogramGenerator,
                        PeakDetector peakDetector,
                        FingerprintGenerator fingerprintGenerator,
                        SongMatcher songMatcher,
                        FingerprintLookupService lookupService,
                        SongRepository songRepository) {
        this.audioProcessor = audioProcessor;
        this.spectrogramGenerator = spectrogramGenerator;
        this.peakDetector = peakDetector;
        this.fingerprintGenerator = fingerprintGenerator;
        this.songMatcher = songMatcher;
        this.lookupService = lookupService;
        this.songRepository = songRepository;
    }

    /**
     * Match a WAV audio clip against the indexed database.
     *
     * @param wavBytes raw WAV file bytes
     * @return match response with ranked results
     */
    public MatchResponse matchWav(byte[] wavBytes) {
        double[] samples;
        try {
            samples = audioProcessor.readBytes(wavBytes);
        } catch (Exception e) {
            throw new AudioProcessingException("Failed to decode query audio: " + e.getMessage(), e);
        }
        return matchSamples(samples);
    }

    /**
     * Match raw PCM bytes (16-bit LE mono 44100 Hz) against the indexed database.
     */
    public MatchResponse matchPcm(byte[] pcmBytes) {
        double[] samples = audioProcessor.readPcmBytes(pcmBytes);
        return matchSamples(samples);
    }

    private MatchResponse matchSamples(double[] samples) {
        if (samples.length < AudioConstants.FRAME_SIZE) {
            throw new AudioProcessingException("Query audio too short for fingerprinting");
        }

        double queryDuration = samples.length / (double) AudioConstants.SAMPLE_RATE;
        log.info("Matching query: {}s, {} samples",
                String.format("%.2f", queryDuration), samples.length);

        // Pipeline: spectrogram → peaks → fingerprints
        double[][] spectrogram = spectrogramGenerator.generateSpectrogram(samples);
        List<PeakDetector.Peak> peaks = peakDetector.detectPeaks(spectrogram);
        List<FingerprintGenerator.Fingerprint> fingerprints = fingerprintGenerator.generateFingerprints(peaks);

        log.info("Query produced {} fingerprints", fingerprints.size());

        if (fingerprints.isEmpty()) {
            return new MatchResponse(List.of(), 0, queryDuration);
        }

        // Match against database via cached lookup
        List<SongMatcher.MatchResult> coreResults = songMatcher.match(
                fingerprints, lookupService::lookup);

        // Convert to DTOs with song metadata
        List<MatchResultDto> dtos = new ArrayList<>();
        for (SongMatcher.MatchResult mr : coreResults) {
            Optional<Song> song = songRepository.findById(mr.getSongId());
            dtos.add(new MatchResultDto(
                    mr.getSongId(),
                    song.map(Song::getTitle).orElse("Unknown"),
                    song.map(Song::getArtist).orElse("Unknown"),
                    mr.getConfidence(),
                    mr.getAlignedMatches(),
                    mr.getTotalMatches(),
                    mr.getTimeOffsetSeconds()
            ));
        }

        return new MatchResponse(dtos, fingerprints.size(), queryDuration);
    }
}
