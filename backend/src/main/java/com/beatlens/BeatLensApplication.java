package com.beatlens;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class BeatLensApplication {

    public static void main(String[] args) {
        SpringApplication.run(BeatLensApplication.class, args);
    }
}
