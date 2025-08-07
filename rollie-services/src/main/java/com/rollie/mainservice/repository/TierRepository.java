package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.TierEntity;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface TierRepository extends R2dbcRepository<TierEntity, Long> {
}
