package com.beatlens.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.file.Files;

/**
 * Handles audio I/O: decoding any supported format to normalised
 * {@code double[]} samples in the range [-1.0, 1.0].
 *
 * <p>All decoding is delegated to FFmpeg, which handles WAV, MP3, FLAC,
 * AAC, OGG, WebM/Opus, M4A, and every other common container/codec.
 * The output is always 44 100 Hz, 16-bit signed little-endian mono PCM.</p>
 */
public class AudioProcessor {

    private static final Logger log = LoggerFactory.getLogger(AudioProcessor.class);

    /**
     * Decode any supported audio format from a file on disk.
     */
    public double[] readFile(File file) throws IOException {
        log.debug("Reading audio file: {}", file.getAbsolutePath());
        byte[] raw = decodeWithFfmpeg(file.getAbsolutePath());
        return bytesToSamples(raw);
    }

    /**
     * Decode any supported audio format from raw bytes (in-memory file).
     * The bytes may be WAV, MP3, FLAC, OGG, WebM, AAC, M4A, etc.
     */
    public double[] readBytes(byte[] audioBytes) throws IOException {
        byte[] raw = decodeWithFfmpegFromBytes(audioBytes);
        return bytesToSamples(raw);
    }

    // ═══ Conversion utilities ═══

    /**
     * 16-bit LE signed PCM bytes → normalised doubles.
     */
    public static double[] bytesToSamples(byte[] pcmBytes) {
        int numSamples = pcmBytes.length / AudioConstants.BYTES_PER_SAMPLE;
        double[] samples = new double[numSamples];
        ByteBuffer buffer = ByteBuffer.wrap(pcmBytes).order(ByteOrder.LITTLE_ENDIAN);
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

    // ═══ FFmpeg internals ═══

    /**
     * Decode audio from a file path via FFmpeg.
     * Output: raw 16-bit signed LE mono PCM at 44100 Hz.
     */
    private byte[] decodeWithFfmpeg(String filePath) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-hide_banner", "-loglevel", "error",
                "-i", filePath,
                "-ar", String.valueOf(AudioConstants.SAMPLE_RATE),
                "-ac", String.valueOf(AudioConstants.CHANNELS),
                "-f", "s16le",
                "pipe:1"
        );
        pb.redirectErrorStream(false);
        return runFfmpeg(pb, null);
    }

    /**
     * Decode audio from an in-memory byte array by writing to a temp file
     * so FFmpeg can probe the container format (piped input can confuse
     * format detection for some containers, e.g. MP3, AAC).
     */
    private byte[] decodeWithFfmpegFromBytes(byte[] audioBytes) throws IOException {
        File tmp = File.createTempFile("beatlens-", ".audio");
        try {
            Files.write(tmp.toPath(), audioBytes);
            return decodeWithFfmpeg(tmp.getAbsolutePath());
        } finally {
            tmp.delete();
        }
    }

    private byte[] runFfmpeg(ProcessBuilder pb, byte[] stdinData) throws IOException {
        Process process = pb.start();

        // Drain stdout and stderr concurrently to avoid pipe deadlock.
        // FFmpeg writes PCM data to stdout (can be tens of MB) and logs to stderr.
        // If either pipe's buffer fills up while we block on the other, FFmpeg hangs.
        var stdoutFuture = new java.util.concurrent.FutureTask<>(() -> {
            try (InputStream s = process.getInputStream()) {
                return s.readAllBytes();
            }
        });
        var stderrFuture = new java.util.concurrent.FutureTask<>(() -> {
            try (InputStream s = process.getErrorStream()) {
                return s.readAllBytes();
            }
        });

        Thread stdoutThread = new Thread(stdoutFuture, "ffmpeg-stdout");
        Thread stderrThread = new Thread(stderrFuture, "ffmpeg-stderr");
        stdoutThread.start();
        stderrThread.start();

        int exitCode;
        try {
            exitCode = process.waitFor();
            stdoutThread.join();
            stderrThread.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("FFmpeg process interrupted", e);
        }

        byte[] pcmBytes;
        byte[] stderrBytes;
        try {
            pcmBytes = stdoutFuture.get();
            stderrBytes = stderrFuture.get();
        } catch (Exception e) {
            throw new IOException("Failed to read FFmpeg output", e);
        }

        if (exitCode != 0) {
            String stderr = stderrBytes.length > 0
                    ? new String(stderrBytes)
                    : "(no stderr output)";
            throw new IOException("FFmpeg failed (exit " + exitCode + "): " + stderr);
        }

        if (pcmBytes.length == 0) {
            throw new IOException("FFmpeg produced no output — unsupported or corrupt audio");
        }

        int numSamples = pcmBytes.length / AudioConstants.BYTES_PER_SAMPLE;
        log.debug("FFmpeg decoded {} bytes ({} samples, {}s)",
                pcmBytes.length, numSamples,
                String.format("%.2f", numSamples / (double) AudioConstants.SAMPLE_RATE));

        return pcmBytes;
    }
}
