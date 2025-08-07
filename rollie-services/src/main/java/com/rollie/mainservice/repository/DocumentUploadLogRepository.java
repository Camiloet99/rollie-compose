package com.rollie.mainservice.repository;

import com.rollie.mainservice.entities.DocumentUploadLog;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface DocumentUploadLogRepository extends ReactiveCrudRepository<DocumentUploadLog, Long> {
}
