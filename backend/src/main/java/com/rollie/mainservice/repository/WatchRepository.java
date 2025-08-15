package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.WatchEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.util.Collection;

public interface WatchRepository extends R2dbcRepository<WatchEntity, Long> {

    @Query("SELECT * FROM watches WHERE cost BETWEEN :min AND :max")
    Flux<WatchEntity> findByCostRange(@Param("min") Double min, @Param("max") Double max);

    @Query("SELECT * FROM watch_entries WHERE reference_code = :reference AND created_at >= :fromDate")
    Flux<WatchEntity> findByReferenceAndRecentDates(
            @Param("reference") String reference,
            @Param("fromDate") LocalDateTime fromDate
    );

    @Query("SELECT * FROM watches WHERE reference_code LIKE CONCAT(:prefix, '%') LIMIT 10")
    Flux<WatchEntity> findByReferenceCodeStartingWith(@Param("prefix") String prefix);

    Flux<WatchEntity> findByReferenceCode(String referenceCode);

    @Query("SELECT * FROM watches WHERE reference_code IN (:references)")
    Flux<WatchEntity> findByReferenceCodeIn(@Param("references") Collection<String> references);

}
