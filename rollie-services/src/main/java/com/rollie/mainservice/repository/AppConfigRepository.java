package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.AppConfigEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface AppConfigRepository extends ReactiveCrudRepository<AppConfigEntity, String> {

    @Query("SELECT * FROM app_config WHERE `config_key` = :key LIMIT 1")
    Mono<AppConfigEntity> findByKey(String key);

}

