package com.beatlens.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Handles audio I/O: reading WAV files and converting between bytes and
 * normalized {@code double[]} samples in the range [-1.0, 1.0].
 *
 * <p>Target format: 44 100 Hz, 16-bit signed, mono, little-endian.</p>
 */
public class AudioProcessor {

    private static final Logger log = LoggerFactory.getLogger(AudioProcessor.class);

    private final AudioFormat targetFormat;

    public AudioProcessor() {
        this(AudioConstants.SAMPLE_RATE, AudioConstants.BITS_PER_SAMPLE, AudioConstants.CHANNELS);
    }

    public AudioProcessor(int sampleRate, int bitsPerSample, int channels) {
        this.targetFormat = new AudioFormat(
                sampleRate,
                bitsPerSample,
                channels,
                true,   // signed
                false   // little-endian
        );
    }

    // ═══ File reading ═══

    /**
     * Read audio samples from a WAV file on disk.
     *
     * @param file the WAV file
     * @return normalised samples in [-1.0, 1.0]
     */
    public double[] readFile(File file) throws IOException, UnsupportedAudioFileException {
        log.debug("Reading audio file: {}", file.getAbsolutePath());

        try (AudioInputStream original = AudioSystem.getAudioInputStream(file)) {
            return readStream(original);
        }
    }

    /**
     * Read audio samples from raw bytes (WAV format).
     *
     * @param audioBytes raw WAV file bytes
     * @return normalised samples in [-1.0, 1.0]
     */
    public double[] readBytes(byte[] audioBytes) throws IOException, UnsupportedAudioFileException {
        try (InputStream bais = new ByteArrayInputStream(audioBytes);
             AudioInputStream original = AudioSystem.getAudioInputStream(bais)) {
            return readStream(original);
        }
    }

    /**
     * Convert raw PCM bytes (already in our target format) to normalised samples.
     */
    public double[] readPcmBytes(byte[] pcmBytes) {
        return bytesToSamples(pcmBytes);
    }

    // ═══ Conversion utilities ═══

    /**
     * 16-bit LE signed PCM bytes → normalised doubles.
     */
    public static double[] bytesToSamples(byte[] audioBytes) {
        int numSamples = audioBytes.length / AudioConstants.BYTES_PER_SAMPLE;
        double[] samples = new double[numSamples];

        ByteBuffer buffer = ByteBuffer.wrap(audioBytes).order(ByteOrder.LITTLE_ENDIAN);
        for (int i = 0; i < numSamples; i++) {
            samples[i] = buffer.getShort() / 32768.0;
        }
        return samples;
    }

    /**
     * Normalised doubles → 16-bit LE signed PCM bytes.
     */
    public static byte[] samplesToBytes(double[] samples) {
        byte[] out = new byte[samples.length * AudioConstants.BYTES_PER_SAMPLE];
        ByteBuffer buffer = ByteBuffer.wrap(out).order(ByteOrder.LITTLE_ENDIAN);

        for (double s : samples) {
            s = Math.max(-1.0, Math.min(1.0, s));
            buffer.putShort((short) (s * 32767));
        }
        return out;
    }

    public AudioFormat getTargetFormat() {
        return targetFormat;
    }

    // ═══ Internals ═══

    private double[] readStream(AudioInputStream original) throws IOException {
        AudioFormat sourceFormat = original.getFormat();
        AudioInputStream stream;

        if (!sourceFormat.matches(targetFormat)) {
            log.debug("Converting from {} to {}", sourceFormat, targetFormat);
            stream = AudioSystem.getAudioInputStream(targetFormat, original);
        } else {
            stream = original;
        }

        byte[] raw = stream.readAllBytes();
        double[] samples = bytesToSamples(raw);
        log.debug("Read {} samples ({}s)", samples.length,
                String.format("%.2f", samples.length / (double) AudioConstants.SAMPLE_RATE));
        return samples;
    }
}
