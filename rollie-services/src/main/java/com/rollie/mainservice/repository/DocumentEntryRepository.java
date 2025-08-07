package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.DocumentEntryEntity;
import org.springframework.data.r2dbc.repository.R2dbcRepository;

public interface DocumentEntryRepository extends R2dbcRepository<DocumentEntryEntity, Long> {
}