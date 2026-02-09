package com.beatlens.controller;

import com.beatlens.model.Song;
import com.beatlens.model.dto.SongDto;
import com.beatlens.service.IndexingService;
import com.beatlens.service.SongService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private static final Logger log = LoggerFactory.getLogger(SongController.class);

    private final SongService songService;
    private final IndexingService indexingService;

    public SongController(SongService songService, IndexingService indexingService) {
        this.songService = songService;
        this.indexingService = indexingService;
    }

    /**
     * Upload and index a new song.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SongDto> uploadSong(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "artist", required = false) String artist) throws IOException {

        log.info("Upload request: title=\"{}\", artist=\"{}\", size={}",
                title, artist, file.getSize());

        Song song = indexingService.indexSong(title, artist, file.getBytes());
        return ResponseEntity.status(HttpStatus.CREATED).body(SongDto.from(song));
    }

    /**
     * List all indexed songs.
     */
    @GetMapping
    public ResponseEntity<List<SongDto>> listSongs() {
        return ResponseEntity.ok(songService.listAllSongs());
    }

    /**
     * Get a single song by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SongDto> getSong(@PathVariable Long id) {
        return ResponseEntity.ok(songService.getSong(id));
    }

    /**
     * Delete a song and its fingerprints.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        songService.deleteSong(id);
        return ResponseEntity.noContent().build();
    }
}
