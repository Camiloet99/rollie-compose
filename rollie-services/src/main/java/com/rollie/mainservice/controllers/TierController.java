package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.TierEntity;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.services.TierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tiers")
@RequiredArgsConstructor
public class TierController {

    private final TierService tierService;

    @PostMapping
    public Mono<ResponseEntity<ResponseBody<TierEntity>>> create(@RequestBody TierEntity tier) {
        log.info(tier.toString());
        return tierService.createTier(tier)
                .map(ControllerUtils::ok);
    }

    @GetMapping
    public Mono<ResponseEntity<ResponseBody<List<TierEntity>>>> getAll() {
        return tierService.getAllTiers()
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ResponseBody<TierEntity>>> update(@PathVariable Long id, @RequestBody TierEntity tier) {
        return tierService.updateTier(id, tier)
                .map(ControllerUtils::ok);
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> delete(@PathVariable Long id) {
        return tierService.deleteTier(id)
                .thenReturn(ControllerUtils.ok(true));
    }

    @PatchMapping("/{id}/deactivate")
    public Mono<ResponseEntity<ResponseBody<TierEntity>>> deactivate(@PathVariable Long id) {
        return tierService.deactivateTier(id)
                .map(ControllerUtils::ok);
    }

    @PatchMapping("/{id}/activate")
    public Mono<ResponseEntity<ResponseBody<TierEntity>>> activate(@PathVariable Long id) {
        return tierService.activateTier(id)
                .map(ControllerUtils::ok);
    }
}

