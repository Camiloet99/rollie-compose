package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.SearchLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

public interface SearchLogRepository extends R2dbcRepository<SearchLogEntity, Long> {

    @Query("SELECT COUNT(*) FROM search_logs WHERE user_id = :userId AND DATE(timestamp) = CURDATE()")
    Mono<Long> countTodaySearchesByUserId(@Param("userId") Long userId);

    Mono<Boolean> existsByUserIdAndReferenceCodeAndLogDate(Long userId, String referenceCode, LocalDate logDate);

}
