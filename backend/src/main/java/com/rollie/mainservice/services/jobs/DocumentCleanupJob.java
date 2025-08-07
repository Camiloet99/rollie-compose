package com.rollie.mainservice.services.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentCleanupJob {

    private final DatabaseClient databaseClient;

    @Scheduled(cron = "0 0 2 * * *") // Todos los días a las 2:00 AM
    public void cleanupExpiredDocuments() {
        String sql = "DELETE FROM watches WHERE created_at < (NOW() - INTERVAL 2 DAY)";

        databaseClient.sql(sql)
                .fetch()
                .rowsUpdated()
                .doOnSubscribe(s -> log.info("[CleanupJob] Starting expired watches document cleanup..."))
                .doOnNext(rows -> log.info("[CleanupJob] Deleted {} expired watches documents", rows))
                .doOnError(err -> log.error("[CleanupJob] Error during cleanup", err))
                .onErrorResume(e -> Mono.empty())
                .subscribe();
    }
}
