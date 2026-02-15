package com.beatlens.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Binds the {@code beatlens.*} properties from application.yml to typed Java fields.
 */
@Configuration
@ConfigurationProperties(prefix = "beatlens")
public class AudioProperties {

    private Audio audio = new Audio();
    private Spectrogram spectrogram = new Spectrogram();
    private PeakDetection peakDetection = new PeakDetection();
    private Fingerprint fingerprint = new Fingerprint();
    private Matching matching = new Matching();

    // ═══ Nested classes ═══

    public static class Audio {
        private int sampleRate = 44100;
        private int bitsPerSample = 16;
        private int channels = 1;

        public int getSampleRate() { return sampleRate; }
        public void setSampleRate(int sampleRate) { this.sampleRate = sampleRate; }
        public int getBitsPerSample() { return bitsPerSample; }
        public void setBitsPerSample(int bitsPerSample) { this.bitsPerSample = bitsPerSample; }
        public int getChannels() { return channels; }
        public void setChannels(int channels) { this.channels = channels; }
    }

    public static class Spectrogram {
        private int frameSize = 4096;
        private int hopSize = 2048;

        public int getFrameSize() { return frameSize; }
        public void setFrameSize(int frameSize) { this.frameSize = frameSize; }
        public int getHopSize() { return hopSize; }
        public void setHopSize(int hopSize) { this.hopSize = hopSize; }
    }

    public static class PeakDetection {
        private int[] frequencyBands = {0, 300, 600, 1200, 2400, 5000, 10000, 22050};
        private int peaksPerFrame = 8;
        private int neighborhoodSize = 15;
        private double minAmplitude = 0.01;

        public int[] getFrequencyBands() { return frequencyBands; }
        public void setFrequencyBands(int[] frequencyBands) { this.frequencyBands = frequencyBands; }
        public int getPeaksPerFrame() { return peaksPerFrame; }
        public void setPeaksPerFrame(int peaksPerFrame) { this.peaksPerFrame = peaksPerFrame; }
        public int getNeighborhoodSize() { return neighborhoodSize; }
        public void setNeighborhoodSize(int neighborhoodSize) { this.neighborhoodSize = neighborhoodSize; }
        public double getMinAmplitude() { return minAmplitude; }
        public void setMinAmplitude(double minAmplitude) { this.minAmplitude = minAmplitude; }
    }

    public static class Fingerprint {
        private int targetZoneSize = 5;
        private int fanOut = 20;
        private int maxTimeDelta = 200;

        public int getTargetZoneSize() { return targetZoneSize; }
        public void setTargetZoneSize(int targetZoneSize) { this.targetZoneSize = targetZoneSize; }
        public int getFanOut() { return fanOut; }
        public void setFanOut(int fanOut) { this.fanOut = fanOut; }
        public int getMaxTimeDelta() { return maxTimeDelta; }
        public void setMaxTimeDelta(int maxTimeDelta) { this.maxTimeDelta = maxTimeDelta; }
    }

    public static class Matching {
        private int offsetTolerance = 3;
        private int minAlignedMatches = 3;
        private double minConfidence = 5.0;

        public int getOffsetTolerance() { return offsetTolerance; }
        public void setOffsetTolerance(int offsetTolerance) { this.offsetTolerance = offsetTolerance; }
        public int getMinAlignedMatches() { return minAlignedMatches; }
        public void setMinAlignedMatches(int minAlignedMatches) { this.minAlignedMatches = minAlignedMatches; }
        public double getMinConfidence() { return minConfidence; }
        public void setMinConfidence(double minConfidence) { this.minConfidence = minConfidence; }
    }

    // ═══ Getters / setters ═══

    public Audio getAudio() { return audio; }
    public void setAudio(Audio audio) { this.audio = audio; }
    public Spectrogram getSpectrogram() { return spectrogram; }
    public void setSpectrogram(Spectrogram spectrogram) { this.spectrogram = spectrogram; }
    public PeakDetection getPeakDetection() { return peakDetection; }
    public void setPeakDetection(PeakDetection peakDetection) { this.peakDetection = peakDetection; }
    public Fingerprint getFingerprint() { return fingerprint; }
    public void setFingerprint(Fingerprint fingerprint) { this.fingerprint = fingerprint; }
    public Matching getMatching() { return matching; }
    public void setMatching(Matching matching) { this.matching = matching; }
}
