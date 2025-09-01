package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.SearchLogEntity;
import com.rollie.mainservice.entities.TierEntity;
import com.rollie.mainservice.entities.UserEntity;
import com.rollie.mainservice.repository.SearchLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserService userService;
    private final TierService tierService;
    private final SearchLogRepository searchLogRepository;

    public Mono<Void> validateSearchLimit(Long userId) {
        return userService.getUserById(userId)
                .flatMap(user -> tierService.getTierById(user.getPlanId())
                        .zipWith(Mono.just(user)))
                .flatMap(tuple -> {
                    TierEntity tier = tuple.getT1();
                    UserEntity user = tuple.getT2();

                    Integer limit = tier.getSearchLimit();
                    boolean unlimited = limit == null || limit == -1;

                    if (unlimited) {
                        return Mono.empty();
                    }

                    return searchLogRepository.countTodaySearchesByUserId(user.getUserId())
                            .flatMap(count -> {
                                if (count >= limit) {
                                    return Mono.error(new RuntimeException("ERR01 - Search exceeded"));
                                }
                                return Mono.empty();
                            });
                });
    }

    public Mono<Void> logSearch(Long userId, String referenceCode) {
        LocalDate today = LocalDate.now();

        return searchLogRepository.existsByUserIdAndReferenceCodeAndLogDate(userId, referenceCode, today)
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.empty(); // Ya existe, no guardar de nuevo
                    }

                    SearchLogEntity log = SearchLogEntity.builder()
                            .userId(userId)
                            .referenceCode(referenceCode)
                            .timestamp(LocalDateTime.now())
                            .success(true)
                            .build();
                    return searchLogRepository.save(log).then();
                });
    }
}
