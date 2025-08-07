package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.AppConfigEntity;
import com.rollie.mainservice.repository.AppConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/admin/config")
@RequiredArgsConstructor
public class MarkupController {

    private final AppConfigRepository appConfigRepository;
    private static final String MARKUP_KEY = "markup_percentage";

    @GetMapping("/markup")
    public Mono<ResponseEntity<Map<String, Double>>> getMarkup() {
        return appConfigRepository.findByKey(MARKUP_KEY)
                .map(config -> {
                    double value = Double.parseDouble(config.getValue());
                    return ResponseEntity.ok(Map.of("result", value));
                })
                .defaultIfEmpty(ResponseEntity.ok(Map.of("result", 0.0)));
    }

    @PutMapping("/markup")
    public Mono<ResponseEntity<Map<String, Object>>> updateMarkup(@RequestBody Map<String, Object> body) {
        if (!body.containsKey("value")) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Missing 'value' in request body")));
        }

        double value;
        try {
            value = Double.parseDouble(body.get("value").toString());
        } catch (NumberFormatException e) {
            return Mono.just(ResponseEntity.badRequest().body(Map.of("error", "Invalid value")));
        }

        return appConfigRepository
                .findByKey(MARKUP_KEY)
                .defaultIfEmpty(AppConfigEntity.builder()
                        .key(MARKUP_KEY)
                        .build())
                .flatMap(existing -> {
                    existing.setValue(String.valueOf(value));
                    return appConfigRepository.save(existing);
                })
                .map(saved -> ResponseEntity.ok(Map.of("result", value)));
    }

}
