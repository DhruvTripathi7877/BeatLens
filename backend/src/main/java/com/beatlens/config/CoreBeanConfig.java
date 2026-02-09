package com.beatlens.config;

import com.beatlens.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the pure-Java core algorithm classes as Spring beans,
 * using values from {@link AudioProperties} (application.yml).
 */
@Configuration
public class CoreBeanConfig {

    @Bean
    public AudioProcessor audioProcessor(AudioProperties props) {
        return new AudioProcessor(
                props.getAudio().getSampleRate(),
                props.getAudio().getBitsPerSample(),
                props.getAudio().getChannels()
        );
    }

    @Bean
    public SpectrogramGenerator spectrogramGenerator(AudioProperties props) {
        return new SpectrogramGenerator(
                props.getSpectrogram().getFrameSize(),
                props.getSpectrogram().getHopSize()
        );
    }

    @Bean
    public PeakDetector peakDetector(AudioProperties props) {
        return new PeakDetector(
                props.getPeakDetection().getNeighborhoodSize(),
                props.getPeakDetection().getMinAmplitude(),
                props.getPeakDetection().getPeaksPerFrame(),
                props.getPeakDetection().getFrequencyBands()
        );
    }

    @Bean
    public FingerprintGenerator fingerprintGenerator(AudioProperties props) {
        return new FingerprintGenerator(
                props.getFingerprint().getTargetZoneSize(),
                props.getFingerprint().getFanOut(),
                props.getFingerprint().getMaxTimeDelta()
        );
    }

    @Bean
    public SongMatcher songMatcher(AudioProperties props) {
        return new SongMatcher(
                props.getMatching().getOffsetTolerance(),
                props.getMatching().getMinAlignedMatches(),
                props.getMatching().getMinConfidence()
        );
    }
}
