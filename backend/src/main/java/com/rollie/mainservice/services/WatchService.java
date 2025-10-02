package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.PageResult;
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

    public Mono<PageResult<WatchEntity>> findAllByReference(String reference, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        int safePage = Math.max(0, page);
        int offset   = safePage * safeSize;

        Mono<Long> totalMono = countByReference(reference);
        Mono<List<WatchEntity>> itemsMono = findByReferencePaged(reference, safeSize, offset)
                .flatMap(this::applyMarkup);

        return Mono.zip(totalMono, itemsMono)
                .map(t -> PageResult.of(t.getT2(), t.getT1(), safePage, safeSize));
    }

    private Mono<Long> countByReference(String reference) {
        String sql = "SELECT COUNT(*) AS c FROM watches WHERE UPPER(reference_code) = UPPER(:reference)";
        return databaseClient.sql(sql)
                .bind("reference", reference == null ? "" : reference.trim())
                .map((row, meta) -> {
                    Object v = row.get("c");
                    if (v instanceof Number) return ((Number) v).longValue();
                    return Long.parseLong(String.valueOf(v));
                })
                .one();
    }

    private Mono<List<WatchEntity>> findByReferencePaged(String reference, int limit, int offset) {
        String sql = String.format(
                "SELECT id, reference_code, color_dial, production_year, watch_condition, " +
                        "       cost, created_at, currency, watch_info, as_of_date " +
                        "FROM watches WHERE UPPER(reference_code) = UPPER(:reference) " +
                        "ORDER BY created_at DESC, id DESC " +
                        "LIMIT %d OFFSET %d", limit, offset
        );

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql)
                .bind("reference", reference == null ? "" : reference.trim());

        spec = spec.filter((st, next) -> { st.fetchSize(1000); return next.execute(st); });

        return spec.map(this::mapRowToWatch).all().collectList();
    }

    public Mono<PageResult<WatchEntity>> searchOrSummary(WatchSearchRequest req, String windowRaw, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 200));
        int safePage = Math.max(0, page);
        final String window = (windowRaw == null ? "" : windowRaw.trim().toLowerCase());

        if ("today".equals(window) || "7d".equals(window) || "15d".equals(window)) {
            LocalDate to = LocalDate.now();
            int days = "today".equals(window) ? 1 : ("7d".equals(window) ? 7 : 15);
            LocalDate from = to.minusDays(days - 1);

            return executeSearchWithRange(
                    req.getReferenceCode(),
                    req.getColorDial(),
                    req.getProductionYear(),
                    req.getCondition(),
                    req.getMinPrice(),
                    req.getMaxPrice(),
                    req.getCurrency(),
                    req.getWatchInfo(),
                    from, to
            )
                    .flatMap(this::applyMarkup)
                    .flatMap(this::aggregateByReferenceAvgUSD)
                    .map(list -> paginateInMemory(list, safePage, safeSize));
        }

        Mono<Long> totalMono = countSearchWithFilters(
                req.getReferenceCode(), req.getColorDial(), req.getProductionYear(),
                req.getCondition(), req.getMinPrice(), req.getMaxPrice(),
                req.getCurrency(), req.getWatchInfo()
        );

        Mono<List<WatchEntity>> itemsMono = findByFiltersPaged(
                req.getReferenceCode(), req.getColorDial(), req.getProductionYear(),
                req.getCondition(), req.getMinPrice(), req.getMaxPrice(),
                req.getCurrency(), req.getWatchInfo(),
                safeSize, safePage * safeSize
        ).flatMap(this::applyMarkup);

        return Mono.zip(totalMono, itemsMono)
                .map(t -> PageResult.of(t.getT2(), t.getT1(), safePage, safeSize));
    }

    private Mono<Long> countSearchWithFilters(
            String referenceCode, String colorDial, Integer productionYear,
            String condition, Double minPrice, Double maxPrice,
            String currency, String watchInfo
    ) {
        StringBuilder sb = new StringBuilder(
                "SELECT COUNT(*) AS c FROM watches WHERE 1=1 "
        );
        if (nonEmpty(referenceCode)) sb.append(" AND UPPER(reference_code) = UPPER(:referenceCode) ");
        if (nonEmpty(colorDial))     sb.append(" AND UPPER(color_dial) = UPPER(:colorDial) ");
        if (productionYear != null)  sb.append(" AND production_year = :productionYear ");
        if (nonEmpty(condition))     sb.append(" AND UPPER(watch_condition) = UPPER(:condition) ");
        if (minPrice != null)        sb.append(" AND cost >= :minPrice ");
        if (maxPrice != null)        sb.append(" AND cost <= :maxPrice ");
        if (nonEmpty(currency))      sb.append(" AND UPPER(currency) = UPPER(:currency) ");
        if (nonEmpty(watchInfo))     sb.append(" AND UPPER(watch_info) LIKE CONCAT('%', UPPER(:watchInfo), '%') ");

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sb.toString());
        if (nonEmpty(referenceCode)) spec = spec.bind("referenceCode", referenceCode.trim());
        if (nonEmpty(colorDial))     spec = spec.bind("colorDial", colorDial.trim());
        if (productionYear != null)  spec = spec.bind("productionYear", productionYear);
        if (nonEmpty(condition))     spec = spec.bind("condition", condition.trim());
        if (minPrice != null)        spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null)        spec = spec.bind("maxPrice", maxPrice);
        if (nonEmpty(currency))      spec = spec.bind("currency", currency.trim());
        if (nonEmpty(watchInfo))     spec = spec.bind("watchInfo", watchInfo.trim());

        return spec.map((row, meta) -> {
            Object v = row.get("c");
            if (v instanceof Number) return ((Number) v).longValue();
            return Long.parseLong(String.valueOf(v));
        }).one();
    }

    private Mono<List<WatchEntity>> findByFiltersPaged(
            String referenceCode, String colorDial, Integer productionYear,
            String condition, Double minPrice, Double maxPrice,
            String currency, String watchInfo,
            int limit, int offset
    ) {
        StringBuilder sb = new StringBuilder(
                "SELECT id, reference_code, color_dial, production_year, watch_condition, " +
                        "       cost, created_at, currency, watch_info, as_of_date " +
                        "FROM watches WHERE 1=1 "
        );
        if (nonEmpty(referenceCode)) sb.append(" AND UPPER(reference_code) = UPPER(:referenceCode) ");
        if (nonEmpty(colorDial))     sb.append(" AND UPPER(color_dial) = UPPER(:colorDial) ");
        if (productionYear != null)  sb.append(" AND production_year = :productionYear ");
        if (nonEmpty(condition))     sb.append(" AND UPPER(watch_condition) = UPPER(:condition) ");
        if (minPrice != null)        sb.append(" AND cost >= :minPrice ");
        if (maxPrice != null)        sb.append(" AND cost <= :maxPrice ");
        if (nonEmpty(currency))      sb.append(" AND UPPER(currency) = UPPER(:currency) ");
        if (nonEmpty(watchInfo))     sb.append(" AND UPPER(watch_info) LIKE CONCAT('%', UPPER(:watchInfo), '%') ");

        sb.append(" ORDER BY created_at DESC, id DESC ");
        sb.append(String.format(" LIMIT %d OFFSET %d ", limit, offset));

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sb.toString());
        if (nonEmpty(referenceCode)) spec = spec.bind("referenceCode", referenceCode.trim());
        if (nonEmpty(colorDial))     spec = spec.bind("colorDial", colorDial.trim());
        if (productionYear != null)  spec = spec.bind("productionYear", productionYear);
        if (nonEmpty(condition))     spec = spec.bind("condition", condition.trim());
        if (minPrice != null)        spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null)        spec = spec.bind("maxPrice", maxPrice);
        if (nonEmpty(currency))      spec = spec.bind("currency", currency.trim());
        if (nonEmpty(watchInfo))     spec = spec.bind("watchInfo", watchInfo.trim());

        spec = spec.filter((st, next) -> { st.fetchSize(1000); return next.execute(st); });

        return spec.map(this::mapRowToWatch).all().collectList();
    }

    // ---------- helpers ----------
    private static boolean nonEmpty(String s) { return s != null && !s.trim().isEmpty(); }

    private <T> PageResult<T> paginateInMemory(List<T> items, int page, int size) {
        int total = items == null ? 0 : items.size();
        int from  = Math.min(page * size, total);
        int to    = Math.min(from + size, total);
        List<T> slice = items == null ? java.util.Collections.emptyList() : items.subList(from, to);
        return PageResult.of(slice, total, page, size);
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
        String fromStr = (from != null) ? from.toString() : null;
        String toStr = (to != null) ? to.toString() : null;

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
        if (currency != null && !currency.isBlank()) {
            sql.append(" AND UPPER(currency) = UPPER(:currency) ");
        }
        if (watchInfo != null && !watchInfo.isBlank()) {
            sql.append(" AND UPPER(watch_info) LIKE CONCAT('%', UPPER(:watchInfo), '%') ");
        }

        sql.append(" ORDER BY reference_code, as_of_date DESC, created_at DESC ");

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql.toString())
                .bind("from", fromStr)
                .bind("to", toStr);

        if (referenceCode != null && !referenceCode.isBlank()) spec = spec.bind("referenceCode", referenceCode.trim());
        if (colorDial != null && !colorDial.isBlank()) spec = spec.bind("colorDial", colorDial.trim());
        if (productionYear != null) spec = spec.bind("productionYear", productionYear);
        if (condition != null && !condition.isBlank()) spec = spec.bind("condition", condition.trim());
        if (minPrice != null) spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null) spec = spec.bind("maxPrice", maxPrice);
        if (currency != null && !currency.isBlank()) spec = spec.bind("currency", currency.trim());
        if (watchInfo != null && !watchInfo.isBlank()) spec = spec.bind("watchInfo", watchInfo.trim());

        return spec.map(this::mapRowToWatch).all().collectList();
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
                .flatMap(map -> mapMaxDate(map.get("max_date")));
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
                if (s.length() >= 10) s = s.substring(0, 10);
                return Mono.just(LocalDate.parse(s));
            } catch (Exception ignore) {
                return Mono.empty();
            }
        }
        try {
            String s = v.toString();
            if (s.length() >= 10) s = s.substring(0, 10);
            return Mono.just(LocalDate.parse(s));
        } catch (Exception ignore) {
            return Mono.empty();
        }
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
