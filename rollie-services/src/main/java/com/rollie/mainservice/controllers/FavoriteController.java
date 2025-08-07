package com.rollie.mainservice.controllers;

import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.models.UserFavorite;
import com.rollie.mainservice.models.requests.AddReferenceRequest;
import com.rollie.mainservice.services.FavoriteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping("/{userId}")
    public Mono<ResponseEntity<ResponseBody<List<String>>>> getFavorites(@PathVariable Long userId) {
        return favoriteService.getFavorites(userId)
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{userId}/add")
    public Mono<ResponseEntity<ResponseBody<UserFavorite>>> addFavorite(
            @PathVariable Long userId,
            @RequestBody AddReferenceRequest request
    ) {
        log.info(userId.toString());
        return favoriteService.addFavorite(userId, request.getReference())
                .map(ControllerUtils::ok);
    }

    @PutMapping("/{userId}/remove")
    public Mono<ResponseEntity<ResponseBody<Boolean>>> removeFavorite(
            @PathVariable Long userId,
            @RequestBody AddReferenceRequest request
    ) {
        return favoriteService.removeFavorite(userId, request.getReference())
                .map(ignore -> ControllerUtils.ok(true));
    }
}
