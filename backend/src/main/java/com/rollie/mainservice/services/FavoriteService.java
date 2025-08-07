package com.rollie.mainservice.services;

import com.rollie.mainservice.models.UserFavorite;
import com.rollie.mainservice.repository.UserFavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final UserFavoriteRepository favoriteRepository;

    public Mono<List<String>> getFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId)
                .map(UserFavorite::getReference)
                .collectList();
    }

    public Mono<UserFavorite> addFavorite(Long userId, String reference) {
        return favoriteRepository.existsByUserIdAndReference(userId, reference)
                .flatMap(exists -> {
                    if (exists) return Mono.empty();
                    UserFavorite fav = new UserFavorite(null, userId, reference);
                    return favoriteRepository.save(fav);
                });
    }

    public Mono<Void> removeFavorite(Long userId, String reference) {
        return favoriteRepository.deleteByUserIdAndReference(userId, reference);
    }
}
