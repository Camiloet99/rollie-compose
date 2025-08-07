package com.rollie.mainservice.repository;

import com.rollie.mainservice.models.UserFavorite;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface UserFavoriteRepository extends R2dbcRepository<UserFavorite, Long> {

    Flux<UserFavorite> findByUserId(Long userId);

    Mono<Boolean> existsByUserIdAndReference(Long userId, String reference);

    Mono<Void> deleteByUserIdAndReference(Long userId, String reference);
}

