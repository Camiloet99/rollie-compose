package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.WatchPriceHistoryResponse;
import com.rollie.mainservice.models.WatchReferenceSummaryResponse;
import com.rollie.mainservice.models.requests.WatchSearchRequest;
import com.rollie.mainservice.repository.AppConfigRepository;
import com.rollie.mainservice.repository.WatchRepository;
import com.rollie.mainservice.services.facades.ExchangeRateService;
import io.r2dbc.spi.Row;
import lombok.AllArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class WatchService {

    private final WatchRepository watchRepository;
    private final DatabaseClient databaseClient;
    private final AppConfigRepository appConfigRepository;
    private final ExchangeRateService exchangeRateService;

    // WatchService.java
    public Mono<List<WatchEntity>> searchWatches(WatchSearchRequest req, String window) {
        final String win = (window == null || window.isBlank())
                ? "today"
                : window.trim().toLowerCase();

        return getLatestAsOfDate()
                .flatMap(latest -> {
                    if (latest == null) return Mono.just(List.<WatchEntity>of());

                    switch (win) {
                        case "7d":
                            return searchAndAggregateByWindow(req, latest, 7);
                        case "15d":
                            return searchAndAggregateByWindow(req, latest, 15);
                        case "today":
                        default:
                            return executeSearchWithAsOf(
                                    req.getReferenceCode(), req.getColorDial(), req.getProductionYear(),
                                    req.getCondition(), req.getMinPrice(), req.getMaxPrice(),
                                    req.getCurrency(), req.getWatchInfo(), latest
                            ).flatMap(this::applyMarkup);
                    }
                })
                .onErrorResume(e -> {
                    // log.warn("searchWatches failed", e);
                    return Mono.just(List.<WatchEntity>of());
                });
    }

    private Mono<LocalDate> mapMaxDate(Object v) {
        if (v == null) return Mono.empty();

        if (v instanceof LocalDate) {
            return Mono.just((LocalDate) v);
        }
        if (v instanceof java.sql.Date) {
            return Mono.just(((java.sql.Date) v).toLocalDate());
        }
        if (v instanceof java.time.LocalDateTime) {
            return Mono.just(((java.time.LocalDateTime) v).toLocalDate());
        }
        if (v instanceof java.sql.Timestamp) {
            return Mono.just(((java.sql.Timestamp) v).toLocalDateTime().toLocalDate());
        }
        if (v instanceof String) {
            String s = (String) v;
            try {
                if (s.length() >= 10) s = s.substring(0, 10); // "yyyy-MM-dd"
                return Mono.just(LocalDate.parse(s));
            } catch (Exception ignore) {
                return Mono.empty();
            }
        }

        // Fallback por si viene otro tipo: intentar parsear toString()
        try {
            String s = v.toString();
            if (s.length() >= 10) s = s.substring(0, 10);
            return Mono.just(LocalDate.parse(s));
        } catch (Exception ignore) {
            return Mono.empty();
        }
    }

    private Mono<LocalDate> getLatestAsOfDateForReference(String reference) {
        return databaseClient.sql(
                        "SELECT MAX(as_of_date) AS max_date " +
                                "FROM watches WHERE UPPER(reference_code) = UPPER(:ref)"
                )
                .bind("ref", reference.trim())
                .fetch()
                .one()
                .flatMap(map -> mapMaxDate(map.get("max_date")));
    }

    private Mono<LocalDate> resolveAnchorDate(String reference, LocalDate globalLatest) {
        return getLatestAsOfDateForReference(reference)
                .switchIfEmpty(Mono.justOrEmpty(globalLatest));
    }

    private Mono<List<WatchEntity>> searchAndAggregateByWindow(WatchSearchRequest req, LocalDate globalLatest, int days) {
        String ref = req.getReferenceCode();

        return resolveAnchorDate(ref, globalLatest)
                .flatMap(anchor -> {
                    if (anchor == null) return Mono.just(List.<WatchEntity>of());
                    LocalDate from = anchor.minusDays(days - 1);
                    LocalDate to = anchor;

                    return executeSearchWithRange(
                            req.getReferenceCode(), req.getColorDial(), req.getProductionYear(),
                            req.getCondition(), req.getMinPrice(), req.getMaxPrice(),
                            req.getCurrency(), req.getWatchInfo(), from, to
                    )
                            .flatMap(this::applyMarkup)
                            .flatMap(this::aggregateByReferenceAvgUSD);
                });
    }

    private Mono<List<WatchEntity>> executeSearchWithRange(
            String referenceCode,
            String colorDial,
            Integer productionYear,
            String condition,
            Double minPrice,
            Double maxPrice,
            String currency,
            String watchInfo,
            LocalDate from,
            LocalDate to
    ) {
        String fromStr = (from != null) ? from.toString() : null; // yyyy-MM-dd
        String toStr   = (to != null)   ? to.toString()   : null;

        StringBuilder sql = new StringBuilder(
                "SELECT id, reference_code, color_dial, production_year, watch_condition, " +
                        "       cost, created_at, currency, watch_info, as_of_date " +
                        "FROM watches " +
                        "WHERE CAST(as_of_date AS DATE) BETWEEN CAST(:from AS DATE) AND CAST(:to AS DATE) "
        );

        if (referenceCode != null && !referenceCode.isBlank()) {
            sql.append(" AND TRIM(UPPER(reference_code)) = TRIM(UPPER(:referenceCode)) ");
        }
        if (colorDial != null && !colorDial.isBlank()) {
            sql.append(" AND UPPER(color_dial) = UPPER(:colorDial) ");
        }
        if (productionYear != null) {
            sql.append(" AND production_year = :productionYear ");
        }
        if (condition != null && !condition.isBlank()) {
            sql.append(" AND UPPER(watch_condition) = UPPER(:condition) ");
        }
        if (minPrice != null) {
            sql.append(" AND cost >= :minPrice ");
        }
        if (maxPrice != null) {
            sql.append(" AND cost <= :maxPrice ");
        }
        if (watchInfo != null && !watchInfo.isBlank()) {
            sql.append(" AND UPPER(watch_info) LIKE CONCAT('%', UPPER(:watchInfo), '%') ");
        }

        sql.append(" ORDER BY reference_code, as_of_date DESC, created_at DESC ");

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql.toString())
                .bind("from", fromStr)
                .bind("to", toStr);

        if (referenceCode != null && !referenceCode.isBlank()) spec = spec.bind("referenceCode", referenceCode.trim());
        if (colorDial != null && !colorDial.isBlank())         spec = spec.bind("colorDial", colorDial.trim());
        if (productionYear != null)                            spec = spec.bind("productionYear", productionYear);
        if (condition != null && !condition.isBlank())         spec = spec.bind("condition", condition.trim());
        if (minPrice != null)                                  spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null)                                  spec = spec.bind("maxPrice", maxPrice);
        if (watchInfo != null && !watchInfo.isBlank())         spec = spec.bind("watchInfo", watchInfo.trim());

        return spec.map(this::mapRowToWatch).all().collectList();
    }

    public Mono<List<WatchEntity>> getWatchByReference(String reference, String window) {
        return getLatestAsOfDateForReference(reference)
                .flatMap(latestForRef -> {
                    if (latestForRef == null) return Mono.just(List.<WatchEntity>of());
                    return executeSearchWithAsOf(
                            reference, null, null, null, null, null, null, null, latestForRef
                    ).flatMap(this::applyMarkup);
                })
                .switchIfEmpty(Mono.just(List.of()));
    }

    public Mono<List<WatchEntity>> getWatchesByReferences(List<String> references) {
        return getLatestAsOfDate()
                .flatMap(latest ->
                        watchRepository.findByReferenceCodeIn(references)
                                .filter(w -> latest.equals(w.getAsOfDate()))
                                .collectList()
                )
                .flatMap(this::applyMarkup)
                .switchIfEmpty(Mono.just(List.of()));
    }

    public Mono<List<WatchEntity>> findWatchesByPriceRange(Double min, Double max) {
        return getLatestAsOfDate()
                .flatMap(latest ->
                        watchRepository.findByCostRange(min, max)
                                .filter(w -> latest.equals(w.getAsOfDate()))
                                .collectList()
                )
                .flatMap(this::applyMarkup)
                .switchIfEmpty(Mono.just(List.of()));
    }

    public Mono<List<WatchPriceHistoryResponse>> getPriceHistory(String reference) {
        LocalDateTime fiveDaysAgo = LocalDateTime.now().minusDays(5);
        return watchRepository.findByReferenceAndRecentDates(reference, fiveDaysAgo)
                .map(entry -> WatchPriceHistoryResponse.builder()
                        .date(entry.getCreatedAt().toLocalDate())
                        .price(entry.getCost())
                        .build()
                )
                .collectList();
    }

    public reactor.core.publisher.Mono<java.util.List<String>> autocompleteReference(String prefix) {
        if (prefix == null || prefix.isBlank()) return reactor.core.publisher.Mono.just(java.util.List.of());
        String cleaned = escapeLike(prefix.trim());
        int limit = 15;
        return watchRepository.autocompleteLatestRefs(cleaned, limit).collectList();
    }

    private String escapeLike(String s) {
        return s.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }

    public Mono<WatchReferenceSummaryResponse> getWatchSummaryByReference(String reference) {
        return getLatestAsOfDate()
                .flatMap(latest ->
                        watchRepository.findByReferenceCode(reference)
                                .filter(w -> latest.equals(w.getAsOfDate()))
                                .collectList()
                )
                .map(watches -> {
                    if (watches == null || watches.isEmpty()) return null;

                    double minPrice = watches.stream()
                            .filter(w -> w.getCost() != null)
                            .mapToDouble(WatchEntity::getCost)
                            .min().orElse(0);

                    double maxPrice = watches.stream()
                            .filter(w -> w.getCost() != null)
                            .mapToDouble(WatchEntity::getCost)
                            .max().orElse(0);

                    List<String> conditions = watches.stream()
                            .map(WatchEntity::getCondition)
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.toList());

                    List<String> extraInfo = watches.stream()
                            .map(WatchEntity::getExtraInfo)
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.toList());

                    List<String> colors = watches.stream()
                            .map(WatchEntity::getColorDial)
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.toList());

                    List<Integer> years = watches.stream()
                            .map(WatchEntity::getProductionYear)
                            .filter(Objects::nonNull)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());

                    LocalDateTime lastCreatedAt = watches.stream()
                            .map(WatchEntity::getCreatedAt)
                            .filter(Objects::nonNull)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);

                    List<String> currencies = watches.stream()
                            .map(WatchEntity::getCurrency)
                            .filter(Objects::nonNull)
                            .distinct()
                            .collect(Collectors.toList());

                    return WatchReferenceSummaryResponse.builder()
                            .referenceCode(reference)
                            .minPrice(minPrice)
                            .maxPrice(maxPrice)
                            .conditions(conditions)
                            .colors(colors)
                            .years(years)
                            .lastCreatedAt(lastCreatedAt)
                            .currencies(currencies)
                            .extraInfo(extraInfo)
                            .build();
                })
                .switchIfEmpty(Mono.justOrEmpty((WatchReferenceSummaryResponse) null));
    }

    private Mono<LocalDate> getLatestAsOfDate() {
        return databaseClient.sql("SELECT MAX(as_of_date) AS max_date FROM document_upload_log")
                .fetch()
                .one()
                .flatMap(map -> {
                    Object v = map.get("max_date");
                    if (v instanceof LocalDate) return Mono.just((LocalDate) v);
                    return Mono.empty();
                });
    }

    private Mono<List<WatchEntity>> executeSearchWithAsOf(
            String referenceCode, String colorDial, Integer year,
            String condition, Double minPrice, Double maxPrice,
            String currency, String watchInfo, LocalDate asOfDate
    ) {
        StringBuilder sql = new StringBuilder("SELECT * FROM watches WHERE as_of_date = :asOfDate");

        if (referenceCode != null && !referenceCode.trim().isEmpty()) {
            sql.append(" AND reference_code = :referenceCode");
        }
        if (colorDial != null && !colorDial.trim().isEmpty()) {
            sql.append(" AND color_dial = :colorDial");
        }
        if (year != null) {
            sql.append(" AND production_year = :year");
        }
        if (condition != null && !condition.trim().isEmpty()) {
            sql.append(" AND watch_condition = :condition");
        }
        if (minPrice != null) {
            sql.append(" AND cost >= :minPrice");
        }
        if (maxPrice != null) {
            sql.append(" AND cost <= :maxPrice");
        }
        if (currency != null && !currency.trim().isEmpty()) {
            sql.append(" AND currency = :currency");
        }
        if (watchInfo != null && !watchInfo.trim().isEmpty()) {
            sql.append(" AND watch_info LIKE :watchInfo");
        }

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql.toString())
                .bind("asOfDate", asOfDate);

        if (referenceCode != null && !referenceCode.trim().isEmpty()) spec = spec.bind("referenceCode", referenceCode);
        if (colorDial != null && !colorDial.trim().isEmpty()) spec = spec.bind("colorDial", colorDial);
        if (year != null) spec = spec.bind("year", year);
        if (condition != null && !condition.trim().isEmpty()) spec = spec.bind("condition", condition);
        if (minPrice != null) spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null) spec = spec.bind("maxPrice", maxPrice);
        if (currency != null && !currency.trim().isEmpty()) spec = spec.bind("currency", currency.trim().toUpperCase());
        if (watchInfo != null && !watchInfo.trim().isEmpty()) spec = spec.bind("watchInfo", "%" + watchInfo + "%");

        spec = spec.filter((statement, next) -> {
            statement.fetchSize(1000);
            return next.execute(statement);
        });

        return spec.map(this::mapRowToWatch)
                .all()
                .collectList();
    }

    private WatchEntity mapRowToWatch(Row row) {
        return WatchEntity.builder()
                .id(row.get("id", Long.class))
                .referenceCode(row.get("reference_code", String.class))
                .colorDial(row.get("color_dial", String.class))
                .productionYear(row.get("production_year", Integer.class))
                .condition(row.get("watch_condition", String.class))
                .cost(row.get("cost", Double.class))
                .createdAt(row.get("created_at", java.time.LocalDateTime.class))
                .currency(row.get("currency", String.class))
                .extraInfo(row.get("watch_info", String.class))
                .asOfDate(row.get("as_of_date", LocalDate.class))
                .build();
    }

    private Mono<Double> getMarkupMultiplier() {
        return appConfigRepository.findByKey("markup_percentage")
                .map(config -> {
                    try {
                        double percentage = Double.parseDouble(config.getValue());
                        return 1 + (percentage / 100.0);
                    } catch (NumberFormatException e) {
                        return 1.0;
                    }
                })
                .defaultIfEmpty(1.0);
    }

    private Mono<List<WatchEntity>> applyMarkup(List<WatchEntity> watches) {
        return getMarkupMultiplier().flatMap(multiplier ->
                Flux.fromIterable(watches)
                        .flatMap(watch -> {
                            if (watch.getCost() == null || watch.getCurrency() == null) {
                                return Mono.just(watch);
                            }

                            String currency = watch.getCurrency().trim().toUpperCase();

                            if ("USD".equals(currency) || "USDT".equals(currency)) {
                                watch.setCost(watch.getCost() * multiplier);
                                return Mono.just(watch);
                            }

                            LocalDate conversionDate = watch.getCreatedAt() != null
                                    ? watch.getCreatedAt().toLocalDate()
                                    : (watch.getAsOfDate() != null ? watch.getAsOfDate() : LocalDate.now());

                            return exchangeRateService.convertToUSD(currency, watch.getCost(), conversionDate)
                                    .map(convertedAmount -> {
                                        watch.setCost(convertedAmount * multiplier);
                                        watch.setCurrency("USD");
                                        return watch;
                                    });
                        })
                        .collectList()
        );
    }

    public Mono<List<WatchEntity>> aggregateByReferenceAvgUSD(List<WatchEntity> rows) {
        if (rows == null || rows.isEmpty()) return Mono.just(List.of());

        return Flux.fromIterable(rows)
                .filter(w -> w.getReferenceCode() != null && w.getCost() != null && w.getCurrency() != null)
                .flatMap(w ->
                        exchangeRateService.convertToUSD(
                                        w.getCurrency(),
                                        w.getCost(),
                                        chooseDateForFx(w)
                                )
                                .map(usd -> Tuples.of(w, usd))
                )
                .collectMultimap(t -> t.getT1().getReferenceCode())
                .map(grouped -> {
                    Comparator<WatchEntity> latestComparator = Comparator
                            .comparing(
                                    WatchEntity::getAsOfDate,
                                    Comparator.nullsLast(Comparator.naturalOrder())
                            )
                            .thenComparing(
                                    WatchEntity::getCreatedAt,
                                    Comparator.nullsLast(Comparator.naturalOrder())
                            );
                    List<WatchEntity> result = new ArrayList<>(grouped.size());

                    for (Map.Entry<String, Collection<Tuple2<WatchEntity, Double>>> e : grouped.entrySet()) {
                        String ref = e.getKey();
                        Collection<Tuple2<WatchEntity, Double>> tuples = e.getValue();

                        double avgUsd = tuples.stream()
                                .mapToDouble(Tuple2::getT2)
                                .average()
                                .orElse(0.0);

                        WatchEntity base = tuples.stream()
                                .map(Tuple2::getT1)
                                .max(latestComparator)
                                .orElseGet(() -> tuples.iterator().next().getT1());

                        WatchEntity aggregated = WatchEntity.builder()
                                .id(base.getId())
                                .referenceCode(base.getReferenceCode())
                                .colorDial(base.getColorDial())
                                .productionYear(base.getProductionYear())
                                .condition(base.getCondition())
                                .cost(avgUsd)
                                .createdAt(base.getCreatedAt())
                                .currency("USD")
                                .extraInfo(base.getExtraInfo())
                                .asOfDate(base.getAsOfDate())
                                .build();

                        result.add(aggregated);
                    }

                    result.sort(Comparator.comparing(WatchEntity::getReferenceCode, Comparator.nullsLast(String::compareTo)));
                    return result;
                });
    }

    private LocalDate chooseDateForFx(WatchEntity w) {
        if (w.getAsOfDate() != null) return w.getAsOfDate();
        LocalDateTime created = w.getCreatedAt();
        if (created != null) return created.toLocalDate();
        return LocalDate.now();
    }
}