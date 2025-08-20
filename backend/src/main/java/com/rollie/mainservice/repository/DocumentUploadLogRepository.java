package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.DocumentUploadLog;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface DocumentUploadLogRepository extends ReactiveCrudRepository<DocumentUploadLog, Long> {

    Flux<DocumentUploadLog> findAllByOrderByUploadTimeDesc();
}

