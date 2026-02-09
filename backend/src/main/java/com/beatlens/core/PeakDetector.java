package com.beatlens.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Finds prominent peaks (local maxima) in a spectrogram using a combined
 * local-maximum + frequency-band approach.
 *
 * <p>Each peak represents a "star" in the constellation map.</p>
 */
public class PeakDetector {

    private static final Logger log = LoggerFactory.getLogger(PeakDetector.class);

    private final int neighborhoodSize;
    private final double minAmplitude;
    private final int maxPeaksPerFrame;
    private final int[] frequencyBandBins;

    /** Represents a detected peak in the spectrogram. */
    public static class Peak {
        public final int frameIndex;
        public final int frequencyBin;
        public final double magnitude;

        public Peak(int frameIndex, int frequencyBin, double magnitude) {
            this.frameIndex = frameIndex;
            this.frequencyBin = frequencyBin;
            this.magnitude = magnitude;
        }

        @Override
        public String toString() {
            return String.format("Peak[frame=%d, bin=%d, mag=%.4f]",
                    frameIndex, frequencyBin, magnitude);
        }
    }

    public PeakDetector() {
        this(AudioConstants.PEAK_NEIGHBORHOOD_SIZE,
             AudioConstants.PEAK_MIN_AMPLITUDE,
             AudioConstants.PEAKS_PER_FRAME,
             AudioConstants.FREQUENCY_BANDS);
    }

    public PeakDetector(int neighborhoodSize, double minAmplitude,
                         int maxPeaksPerFrame, int[] frequencyBandsHz) {
        this.neighborhoodSize = neighborhoodSize;
        this.minAmplitude = minAmplitude;
        this.maxPeaksPerFrame = maxPeaksPerFrame;

        this.frequencyBandBins = new int[frequencyBandsHz.length];
        for (int i = 0; i < frequencyBandsHz.length; i++) {
            frequencyBandBins[i] = AudioConstants.frequencyToBin(frequencyBandsHz[i]);
        }
    }

    /**
     * Detect peaks across the entire spectrogram.
     *
     * @param spectrogram {@code double[numFrames][numBins]}
     * @return list of detected peaks
     */
    public List<Peak> detectPeaks(double[][] spectrogram) {
        List<Peak> allPeaks = new ArrayList<>();
        if (spectrogram.length == 0) return allPeaks;

        int numBins = spectrogram[0].length;
        double globalMax = findGlobalMax(spectrogram);
        double threshold = globalMax * minAmplitude;

        for (int frame = 0; frame < spectrogram.length; frame++) {
            List<Peak> framePeaks = detectPeaksInFrame(spectrogram, frame, numBins, threshold);
            allPeaks.addAll(framePeaks);
        }

        log.debug("Detected {} peaks across {} frames", allPeaks.size(), spectrogram.length);
        return allPeaks;
    }

    // ═══ Internals ═══

    private List<Peak> detectPeaksInFrame(double[][] spectrogram, int frame,
                                           int numBins, double threshold) {
        List<Peak> candidates = new ArrayList<>();

        for (int band = 0; band < frequencyBandBins.length - 1; band++) {
            int bandStart = frequencyBandBins[band];
            int bandEnd = Math.min(frequencyBandBins[band + 1], numBins);

            for (int bin = bandStart; bin < bandEnd; bin++) {
                double value = spectrogram[frame][bin];
                if (value < threshold) continue;
                if (isLocalMaximum(spectrogram, frame, bin)) {
                    candidates.add(new Peak(frame, bin, value));
                }
            }
        }

        candidates.sort(Comparator.comparingDouble((Peak p) -> p.magnitude).reversed());
        return (candidates.size() > maxPeaksPerFrame)
                ? new ArrayList<>(candidates.subList(0, maxPeaksPerFrame))
                : candidates;
    }

    private boolean isLocalMaximum(double[][] spectrogram, int frame, int bin) {
        double value = spectrogram[frame][bin];
        int numFrames = spectrogram.length;
        int numBins = spectrogram[0].length;

        int fStart = Math.max(0, frame - neighborhoodSize);
        int fEnd = Math.min(numFrames - 1, frame + neighborhoodSize);
        int bStart = Math.max(0, bin - neighborhoodSize);
        int bEnd = Math.min(numBins - 1, bin + neighborhoodSize);

        for (int f = fStart; f <= fEnd; f++) {
            for (int b = bStart; b <= bEnd; b++) {
                if (f == frame && b == bin) continue;
                if (spectrogram[f][b] >= value) return false;
            }
        }
        return true;
    }

    private double findGlobalMax(double[][] spectrogram) {
        double max = 0;
        for (double[] frame : spectrogram) {
            for (double v : frame) {
                if (v > max) max = v;
            }
        }
        return max;
    }
}
