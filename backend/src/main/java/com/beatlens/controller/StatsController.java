package com.beatlens.controller;

import com.beatlens.model.dto.StatsDto;
import com.beatlens.service.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StatsController {

    private final SongService songService;

    public StatsController(SongService songService) {
        this.songService = songService;
    }

    @GetMapping("/stats")
    public ResponseEntity<StatsDto> getStats() {
        return ResponseEntity.ok(songService.getStats());
    }
}
