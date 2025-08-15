package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.WatchPriceHistoryResponse;
import com.rollie.mainservice.models.WatchReferenceSummaryResponse;
import com.rollie.mainservice.repository.AppConfigRepository;
import com.rollie.mainservice.repository.WatchRepository;
import com.rollie.mainservice.services.facades.ExchangeRateService;
import io.r2dbc.spi.Row;
import lombok.AllArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class WatchService {

    private final WatchRepository watchRepository;
    private DatabaseClient databaseClient;
    private AppConfigRepository appConfigRepository;
    private final ExchangeRateService exchangeRateService;

    public Mono<List<WatchEntity>> searchWatches(
            String referenceCode,
            String colorDial,
            Integer productionYear,
            String condition,
            Double minPrice,
            Double maxPrice,
            String currency,
            String watchInfo,
            Boolean lastDayOnly) {

        if (Boolean.TRUE.equals(lastDayOnly)) {
            LocalDate today = LocalDate.now();
            LocalDateTime startOfToday = today.atStartOfDay();
            LocalDateTime startOfYesterday = today.minusDays(1).atStartOfDay();

            return executeSearch(referenceCode, colorDial, productionYear, condition,
                    minPrice, maxPrice, currency, watchInfo, startOfToday)
                    .flatMap(todayResults -> {
                        if (!todayResults.isEmpty()) {
                            return Mono.just(todayResults);
                        } else {
                            return executeSearch(referenceCode, colorDial, productionYear, condition,
                                    minPrice, maxPrice, currency, watchInfo, startOfYesterday);
                        }
                    });
        }

        // nuevo comportamiento por defecto: sin filtro de fecha
        return executeSearchNoDate(referenceCode, colorDial, productionYear, condition,
                minPrice, maxPrice, currency, watchInfo)
                .flatMap(this::applyMarkup);
    }

    private Mono<List<WatchEntity>> executeSearchNoDate(
            String referenceCode, String colorDial, Integer year,
            String condition, Double minPrice, Double maxPrice,
            String currency, String watchInfo) {

        StringBuilder sql = new StringBuilder("SELECT * FROM watches WHERE 1=1");

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

        var spec = databaseClient.sql(sql.toString())
                .filter((statement, next) -> { statement.fetchSize(1000); return next.execute(statement); });

        if (referenceCode != null && !referenceCode.trim().isEmpty()) spec = spec.bind("referenceCode", referenceCode);
        if (colorDial != null && !colorDial.trim().isEmpty()) spec = spec.bind("colorDial", colorDial);
        if (year != null) spec = spec.bind("year", year);
        if (condition != null && !condition.trim().isEmpty()) spec = spec.bind("condition", condition);
        if (minPrice != null) spec = spec.bind("minPrice", minPrice);
        if (maxPrice != null) spec = spec.bind("maxPrice", maxPrice);
        if (currency != null && !currency.trim().isEmpty()) spec = spec.bind("currency", currency.trim().toUpperCase());
        if (watchInfo != null && !watchInfo.trim().isEmpty()) spec = spec.bind("watchInfo", "%" + watchInfo + "%");

        return spec.map((row, meta) -> mapRowToWatch(row))
                .all()
                .collectList()
                .flatMap(this::applyMarkup);
    }

    public Mono<List<WatchEntity>> getWatchByReference(String reference) {
        return watchRepository.findByReferenceCode(reference)
                .collectList()
                .flatMap(this::applyMarkup);
    }

    public Mono<List<WatchEntity>> getWatchesByReferences(List<String> references) {
        return watchRepository.findByReferenceCodeIn(references)
                .collectList()
                .flatMap(this::applyMarkup);
    }

    private Mono<List<WatchEntity>> executeSearch(String referenceCode, String colorDial, Integer year,
                                                  String condition, Double minPrice, Double maxPrice,
                                                  String currency, String watchInfo, LocalDateTime fromDate) {

        StringBuilder sql = new StringBuilder("SELECT * FROM watches WHERE created_at >= :fromDate");

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
        if (maxPrice != null) {
            sql.append(" AND cost <= :maxPrice");
        }
        if (minPrice != null) {
            sql.append(" AND cost >= :minPrice");
        }
        if (currency != null && !currency.trim().isEmpty()) {
            sql.append(" AND currency = :currency");
        }
        if (watchInfo != null && !watchInfo.trim().isEmpty()) {
            sql.append(" AND watch_info ILIKE :watchInfo");
        }

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql.toString())
                .bind("fromDate", fromDate);

        if (referenceCode != null && !referenceCode.trim().isEmpty()) {
            spec = spec.bind("referenceCode", referenceCode);
        }
        if (colorDial != null && !colorDial.trim().isEmpty()) {
            spec = spec.bind("colorDial", colorDial);
        }
        if (year != null) {
            spec = spec.bind("year", year);
        }
        if (condition != null && !condition.trim().isEmpty()) {
            spec = spec.bind("condition", condition);
        }
        if (maxPrice != null) {
            spec = spec.bind("maxPrice", maxPrice);
        }
        if (minPrice != null) {
            spec = spec.bind("minPrice", minPrice);
        }
        if (currency != null && !currency.trim().isEmpty()) {
            spec = spec.bind("currency", currency);
        }
        if (watchInfo != null && !watchInfo.trim().isEmpty()) {
            spec = spec.bind("watchInfo", "%" + watchInfo + "%");
        }

        return spec.map((row, meta) -> mapRowToWatch(row))
                .all()
                .collectList()
                .flatMap(this::applyMarkup);
    }


    private WatchEntity mapRowToWatch(Row row) {
        WatchEntity w = new WatchEntity();
        w.setId(row.get("id", Long.class));
        w.setReferenceCode(row.get("reference_code", String.class));
        w.setColorDial(row.get("color_dial", String.class));
        w.setProductionYear(row.get("production_year", Integer.class));
        w.setCondition(row.get("watch_condition", String.class));
        w.setCost(row.get("cost", Double.class));
        w.setCurrency(row.get("currency", String.class));
        w.setExtraInfo(row.get("watch_info", String.class));
        w.setCreatedAt(row.get("created_at", LocalDateTime.class));
        return w;
    }

    public Mono<List<WatchEntity>> findWatchesByPriceRange(Double min, Double max) {
        return watchRepository.findByCostRange(min, max)
                .collectList()
                .flatMap(this::applyMarkup);
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

    public Mono<List<String>> autocompleteReference(String prefix) {
        return watchRepository.findByReferenceCodeStartingWith(prefix)
                .map(WatchEntity::getReferenceCode)
                .distinct()
                .collectList();
    }

    public Mono<WatchReferenceSummaryResponse> getWatchSummaryByReference(String reference) {
        return watchRepository.findByReferenceCode(reference)
                .collectList()
                .map(watches -> {
                    if (watches.isEmpty()) return null;

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
                });
    }

    private Mono<List<WatchEntity>> getLatestWatchData(Function<LocalDateTime, Flux<WatchEntity>> queryByDate) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfYesterday = today.minusDays(1).atStartOfDay();

        return queryByDate.apply(startOfToday)
                .collectList()
                .flatMap(todayList -> {
                    if (!todayList.isEmpty()) {
                        return Mono.just(todayList);
                    } else {
                        return queryByDate.apply(startOfYesterday)
                                .collectList();
                    }
                })
                .flatMap(this::applyMarkup);
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
                .defaultIfEmpty(1.0); // Si no está configurado, no aplica markup
    }

    private Mono<List<WatchEntity>> applyMarkup(List<WatchEntity> watches) {
        return getMarkupMultiplier().flatMap(multiplier ->
                Flux.fromIterable(watches)
                        .flatMap(watch -> {
                            if (watch.getCost() == null || watch.getCurrency() == null) {
                                return Mono.just(watch); // Skip if incomplete
                            }

                            String currency = watch.getCurrency().trim().toUpperCase();

                            // Skip conversion if already in USD or USDT
                            if (currency.equals("USD") || currency.equals("USDT")) {
                                watch.setCost(watch.getCost() * multiplier);
                                return Mono.just(watch);
                            }

                            LocalDate conversionDate = watch.getCreatedAt() != null
                                    ? watch.getCreatedAt().toLocalDate()
                                    : LocalDate.now();

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



}