package com.beatlens.controller;

import com.beatlens.model.dto.MatchResponse;
import com.beatlens.service.MatchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
public class MatchController {

    private static final Logger log = LoggerFactory.getLogger(MatchController.class);

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    /**
     * Match an audio clip against the indexed database.
     *
     * Accepts any audio format that FFmpeg supports: WAV, MP3, FLAC, OGG,
     * WebM/Opus, AAC, M4A, etc. Format is detected automatically.
     */
    @PostMapping(value = "/match", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MatchResponse> match(
            @RequestParam("file") MultipartFile file) throws IOException {

        log.info("Match request: size={}, contentType={}", file.getSize(), file.getContentType());

        MatchResponse response = matchService.match(file.getBytes());

        log.info("Match completed: {} results", response.results().size());
        return ResponseEntity.ok(response);
    }
}
