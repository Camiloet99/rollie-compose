package com.rollie.mainservice.services;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.*;
import com.rollie.mainservice.services.facades.ExchangeRateService;
import lombok.AllArgsConstructor;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class WatchQueryService {

    private final DatabaseClient databaseClient;
    private final ExchangeRateService exchangeRateService;

    public Mono<List<String>> autocomplete(String prefix) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return Mono.just(java.util.Collections.emptyList());
        }

        String clean = prefix.trim().toUpperCase() + "%";

        String sql = "SELECT DISTINCT modelo AS value " +
                "FROM watches " +
                "WHERE UPPER(modelo) LIKE :pref " +
                "ORDER BY modelo ASC " +
                "LIMIT 15";

        return databaseClient.sql(sql)
                .bind("pref", clean)
                .map((row, meta) -> row.get("value", String.class))
                .all()
                .collectList();
    }

    /* ======================
       BÚSQUEDA AVANZADA
       ====================== */
    public Mono<PageResult<WatchEntity>> search(WatchFilter f, PageRequestEx req) {
        int size = Math.max(1, Math.min(req.getSize() == 0 ? 50 : req.getSize(), 200));
        int page = Math.max(0, req.getPage());
        int offset = page * size;

        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        if (nonEmpty(f.getBrand()))     { where.append(" AND UPPER(brand) = UPPER(:brand) ");           params.put("brand", f.getBrand().trim()); }
        if (nonEmpty(f.getModelo()))    { where.append(" AND UPPER(modelo) = UPPER(:modelo) ");         params.put("modelo", f.getModelo().trim()); }
        if (nonEmpty(f.getColor()))     { where.append(" AND UPPER(color) = UPPER(:color) ");           params.put("color", f.getColor().trim()); }
        if (nonEmpty(f.getCondicion())) { where.append(" AND UPPER(condicion) = UPPER(:condicion) ");   params.put("condicion", f.getCondicion().trim()); }
        if (nonEmpty(f.getBracelet()))  { where.append(" AND UPPER(bracelet) = UPPER(:bracelet) ");     params.put("bracelet", f.getBracelet().trim()); }

        // NUEVO: estado
        if (nonEmpty(f.getEstado()))    { where.append(" AND UPPER(estado) = UPPER(:estado) ");         params.put("estado", f.getEstado().trim()); }

        // Año: exacto si viene 'anio', si no, rango
        if (f.getAnio() != null) {
            where.append(" AND anio = :anio "); params.put("anio", f.getAnio());
        } else {
            if (f.getAnioFrom() != null) { where.append(" AND anio >= :anioFrom "); params.put("anioFrom", f.getAnioFrom()); }
            if (f.getAnioTo() != null)   { where.append(" AND anio <= :anioTo ");   params.put("anioTo",   f.getAnioTo()); }
        }

        if (f.getPriceMin() != null)    { where.append(" AND monto_final >= :pmin "); params.put("pmin", f.getPriceMin()); }
        if (f.getPriceMax() != null)    { where.append(" AND monto_final <= :pmax "); params.put("pmax", f.getPriceMax()); }
        if (nonEmpty(f.getCurrency()))  { where.append(" AND UPPER(currency) = UPPER(:curr) "); params.put("curr", f.getCurrency().trim()); }

        // Texto: usa text si llega, si no info
        String effectiveText = nonEmpty(f.getText()) ? f.getText() : f.getInfo();
        if (nonEmpty(effectiveText)) {
            where.append(" AND UPPER(clean_text) LIKE CONCAT('%', UPPER(:txt), '%') ");
            params.put("txt", effectiveText.trim());
        }

        if (f.getAsOfFrom() != null)    { where.append(" AND as_of_date >= :asFrom "); params.put("asFrom", f.getAsOfFrom()); }
        if (f.getAsOfTo() != null)      { where.append(" AND as_of_date <= :asTo ");   params.put("asTo",   f.getAsOfTo()); }

        String sortKey = (req.getSort() == null) ? "date_desc" : req.getSort();
        String orderBy;
        if ("price_asc".equalsIgnoreCase(sortKey)) {
            orderBy = " ORDER BY monto_final ASC, id ASC ";
        } else if ("price_desc".equalsIgnoreCase(sortKey)) {
            orderBy = " ORDER BY monto_final DESC, id DESC ";
        } else if ("brand_asc".equalsIgnoreCase(sortKey)) {
            orderBy = " ORDER BY brand ASC, modelo ASC, id ASC ";
        } else if ("brand_desc".equalsIgnoreCase(sortKey)) {
            orderBy = " ORDER BY brand DESC, modelo DESC, id DESC ";
        } else if ("date_asc".equalsIgnoreCase(sortKey)) {
            orderBy = " ORDER BY created_at ASC, id ASC ";
        } else { // date_desc por defecto
            orderBy = " ORDER BY created_at DESC, id DESC ";
        }

        String baseSelect =
                "SELECT id, fecha_archivo, clean_text, brand, modelo, currency, monto, descuento, " +
                        "       monto_final, estado, condicion, anio, bracelet, color, as_of_date, created_at " +
                        "FROM watches ";

        String sqlItems = baseSelect + where + orderBy + " LIMIT :limit OFFSET :offset ";
        String sqlCount = "SELECT COUNT(*) AS c FROM watches " + where;

        DatabaseClient.GenericExecuteSpec countSpec = databaseClient.sql(sqlCount);
        DatabaseClient.GenericExecuteSpec itemSpec  = databaseClient.sql(sqlItems);

        for (Map.Entry<String, Object> e : params.entrySet()) {
            countSpec = countSpec.bind(e.getKey(), e.getValue());
            itemSpec  = itemSpec.bind(e.getKey(), e.getValue());
        }
        itemSpec = itemSpec.bind("limit", size).bind("offset", offset);

        Mono<Long> totalMono = countSpec.map((row, meta) -> {
            Object v = row.get("c");
            if (v instanceof Number) return ((Number) v).longValue();
            return Long.parseLong(String.valueOf(v));
        }).one();

        // *** FX / USD ***
        // 1) Traemos los items
        // 2) Convertimos monto_final a USD usando ExchangeRateService
        Mono<List<WatchEntity>> itemsMono = itemSpec
                .map(this::mapRow)
                .all()
                .flatMap(this::convertEntityToUsd)   // <--- conversión a USD por item
                .collectList();

        return Mono.zip(totalMono, itemsMono)
                .map(t -> PageResult.of(t.getT2(), t.getT1(), page, size));
    }


    public Mono<PageResult<WatchEntity>> averageByWindow(WatchFilter f,
                                                         String window,
                                                         PageRequestEx req,
                                                         String avgModeStr) {
        // Debe venir brand o modelo (igual que antes)
        boolean hasBrand  = f.getBrand()  != null && !f.getBrand().trim().isEmpty();
        boolean hasModelo = f.getModelo() != null && !f.getModelo().trim().isEmpty();
        if (!hasBrand && !hasModelo) {
            return Mono.error(new IllegalArgumentException("Missing brand or modelo for average search"));
        }

        // Modo de promedio: ALL (default), LOW, MID, HIGH
        AvgMode avgMode = AvgMode.from(avgModeStr);

        // Ventana: today / 7d / 15d  (rango inclusivo)
        final LocalDate to   = LocalDate.now();
        final LocalDate from =
                "7d".equalsIgnoreCase(window)  ? to.minusDays(6) :
                        "15d".equalsIgnoreCase(window) ? to.minusDays(14) : to; // default: today

        // WHERE dinámico (similar al método anterior, pero SIN group/AVG)
        StringBuilder where = new StringBuilder(" WHERE as_of_date BETWEEN :from AND :to ");
        Map<String, Object> params = new HashMap<>();
        params.put("from", from);
        params.put("to",   to);

        if (hasBrand)                   { where.append(" AND UPPER(brand)    = UPPER(:brand) ");      params.put("brand", f.getBrand().trim()); }
        if (hasModelo)                  { where.append(" AND UPPER(modelo)   = UPPER(:modelo) ");     params.put("modelo", f.getModelo().trim()); }
        if (nonEmpty(f.getColor()))     { where.append(" AND UPPER(color)    = UPPER(:color) ");      params.put("color", f.getColor().trim()); }
        if (nonEmpty(f.getCondicion())) { where.append(" AND UPPER(condicion)= UPPER(:condicion) ");  params.put("condicion", f.getCondicion().trim()); }
        if (nonEmpty(f.getBracelet()))  { where.append(" AND UPPER(bracelet) = UPPER(:bracelet) ");   params.put("bracelet", f.getBracelet().trim()); }
        if (nonEmpty(f.getEstado()))    { where.append(" AND UPPER(estado)   = UPPER(:estado) ");     params.put("estado", f.getEstado().trim()); }

        if (f.getAnio() != null)        {
            where.append(" AND anio = :anio ");
            params.put("anio", f.getAnio());
        } else {
            if (f.getAnioFrom() != null){
                where.append(" AND anio >= :anioFrom ");
                params.put("anioFrom", f.getAnioFrom());
            }
            if (f.getAnioTo()   != null){
                where.append(" AND anio <= :anioTo ");
                params.put("anioTo",   f.getAnioTo());
            }
        }

        if (f.getPriceMin() != null)    { where.append(" AND monto_final >= :pmin ");                 params.put("pmin", f.getPriceMin()); }
        if (f.getPriceMax() != null)    { where.append(" AND monto_final <= :pmax ");                 params.put("pmax", f.getPriceMax()); }
        if (nonEmpty(f.getCurrency()))  { where.append(" AND UPPER(currency) = UPPER(:curr) ");       params.put("curr", f.getCurrency().trim()); }

        // Texto opcional (clean_text)
        String effectiveText = nonEmpty(f.getText()) ? f.getText() : f.getInfo();
        if (nonEmpty(effectiveText)) {
            where.append(" AND UPPER(clean_text) LIKE CONCAT('%', UPPER(:txt), '%') ");
            params.put("txt", effectiveText.trim());
        }

        // Query cruda: traemos filas individuales
        String sql =
                "SELECT brand, modelo, currency, monto_final, as_of_date, created_at " +
                        "FROM watches " + where.toString();

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> e : params.entrySet()) {
            spec = spec.bind(e.getKey(), e.getValue());
        }

        // *** FX / USD ***
        // 1) Traemos filas
        // 2) Convertimos cada monto_final a USD
        // 3) Agrupamos por brand+modelo (ya todo en USD)
        return spec.map((row, meta) -> new RowLite(row))
                .all()
                .flatMap(r -> {
                    BigDecimal mf = r.get("monto_final", BigDecimal.class);
                    String curr   = r.get("currency", String.class);
                    if (mf == null || curr == null) {
                        return Mono.empty();
                    }
                    LocalDate fxDate = resolveFxDate(
                            r.get("as_of_date", LocalDate.class),
                            r.get("created_at", LocalDateTime.class)
                    );
                    return exchangeRateService.convertToUSD(curr, mf.doubleValue(), fxDate)
                            .map(usd -> Tuples.of(r, usd));
                })
                .collectList()
                .map(list -> {
                    // 1) Agrupar por brand + modelo (ya no por currency, todo está en USD)
                    Map<String, List<Tuple2<RowLite, Double>>> grouped = list.stream()
                            .collect(Collectors.groupingBy(t -> {
                                RowLite r = t.getT1();
                                String b = r.get("brand", String.class);
                                String m = r.get("modelo", String.class);
                                return (b == null ? "" : b) + "|" + (m == null ? "" : m);
                            }));

                    List<WatchEntity> aggregates = new ArrayList<>();

                    for (Map.Entry<String, List<Tuple2<RowLite, Double>>> entry : grouped.entrySet()) {
                        List<Tuple2<RowLite, Double>> groupRows = entry.getValue();

                        // Lista de precios en USD
                        List<BigDecimal> pricesUsd = groupRows.stream()
                                .map(Tuple2::getT2)
                                .map(BigDecimal::valueOf)
                                .sorted()
                                .collect(Collectors.toList());

                        if (pricesUsd.isEmpty()) continue;

                        double avgPrice = computeAvgByMode(pricesUsd, avgMode);

                        // tomamos datos base de la primera fila (brand/modelo)
                        RowLite base = groupRows.get(0).getT1();
                        String brand  = base.get("brand", String.class);
                        String modelo = base.get("modelo", String.class);

                        // última fecha en la ventana
                        LocalDate lastAsOf = groupRows.stream()
                                .map(t -> t.getT1().get("as_of_date", LocalDate.class))
                                .filter(Objects::nonNull)
                                .max(Comparator.naturalOrder())
                                .orElse(null);

                        // último created_at en la ventana
                        LocalDateTime lastCreated = groupRows.stream()
                                .map(t -> t.getT1().get("created_at", LocalDateTime.class))
                                .filter(Objects::nonNull)
                                .max(Comparator.naturalOrder())
                                .orElse(null);

                        WatchEntity we = WatchEntity.builder()
                                .id(null)
                                .fechaArchivo(null)
                                .cleanText(null)
                                .brand(brand)
                                .modelo(modelo)
                                .currency("USD") // <-- siempre USD
                                .monto(null)
                                .descuento(null)
                                .montoFinal(BigDecimal.valueOf(avgPrice)) // promedio en USD
                                .estado(null)
                                .condicion(null)
                                .anio(null)
                                .bracelet(null)
                                .color(null)
                                .asOfDate(lastAsOf)
                                .createdAt(lastCreated)
                                .build();

                        aggregates.add(we);
                    }

                    // 2) Ordenar según sort (price / brand / date)
                    String sortKey = (req.getSort() == null) ? "price_desc" : req.getSort();
                    Comparator<WatchEntity> cmp;
                    switch (sortKey.toLowerCase()) {
                        case "price_asc":
                            cmp = Comparator.comparing(
                                    WatchEntity::getMontoFinal,
                                    Comparator.nullsLast(BigDecimal::compareTo)
                            );
                            break;
                        case "price_desc":
                            cmp = Comparator.comparing(
                                    WatchEntity::getMontoFinal,
                                    Comparator.nullsLast(BigDecimal::compareTo)
                            ).reversed();
                            break;
                        case "brand_asc":
                            cmp = Comparator
                                    .comparing(WatchEntity::getBrand, Comparator.nullsLast(String::compareTo))
                                    .thenComparing(WatchEntity::getModelo, Comparator.nullsLast(String::compareTo));
                            break;
                        case "brand_desc":
                            cmp = Comparator
                                    .comparing(WatchEntity::getBrand, Comparator.nullsLast(String::compareTo)).reversed()
                                    .thenComparing(WatchEntity::getModelo, Comparator.nullsLast(String::compareTo)).reversed();
                            break;
                        default:
                            // por fecha (createdAt)
                            cmp = Comparator.comparing(
                                    WatchEntity::getCreatedAt,
                                    Comparator.nullsLast(LocalDateTime::compareTo)
                            ).reversed();
                    }

                    aggregates.sort(cmp);

                    // 3) Paginación en memoria
                    int size = Math.max(1, Math.min(req.getSize() == 0 ? 50 : req.getSize(), 200));
                    int page = Math.max(0, req.getPage());
                    int total = aggregates.size();

                    int fromIx = Math.min(page * size, total);
                    int toIx   = Math.min(fromIx + size, total);

                    List<WatchEntity> pageItems =
                            (fromIx >= toIx) ? Collections.emptyList() : aggregates.subList(fromIx, toIx);

                    return PageResult.of(pageItems, total, page, size);
                });
    }

    private double computeAvgByMode(List<BigDecimal> sortedPrices, AvgMode mode) {
        int n = sortedPrices.size();
        if (n == 0) return 0;

        // convertimos a double para facilitar
        List<Double> vals = sortedPrices.stream()
                .map(BigDecimal::doubleValue)
                .sorted()
                .collect(Collectors.toList());

        if (mode == AvgMode.ALL) {
            return vals.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        }

        // dividimos en 3 terciles
        int tercilSize = Math.max(1, n / 3); // al menos 1 elemento

        int start, end;
        switch (mode) {
            case LOW:
                start = 0;
                end   = tercilSize;
                break;
            case MID:
                start = tercilSize;
                end   = Math.min(2 * tercilSize, n);
                // si n < 3, ajustamos para que haya algo
                if (start >= end) {
                    start = 0;
                    end = n;
                }
                break;
            case HIGH:
            default:
                start = Math.max(n - tercilSize, 0);
                end   = n;
                break;
        }

        return vals.subList(start, end).stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0);
    }



    /* ======================
       FACETAS
       ====================== */
    public Mono<FacetsResponse> facets(WatchFilter f) {
        String where = buildWhere(f);
        Map<String, Object> params = buildParams(f);

        Mono<Map<String, Long>> byBrand = countGroup("brand", where, params);
        Mono<Map<String, Long>> byColor = countGroup("color", where, params);
        Mono<Map<String, Long>> byCond  = countGroup("condicion", where, params);
        Mono<Map<String, Long>> byBrace = countGroup("bracelet", where, params);
        Mono<Map<Integer, Long>> byAnio = countGroupInt("anio", where, params);

        return Mono.zip(byBrand, byColor, byCond, byBrace, byAnio)
                .map(t -> FacetsResponse.builder()
                        .byBrand(t.getT1())
                        .byColor(t.getT2())
                        .byCondicion(t.getT3())
                        .byBracelet(t.getT4())
                        .byAnio(t.getT5())
                        .build()
                );
    }

    /* ======================
       RESUMEN POR MODELO
       ====================== */
    public Mono<ModelSummary> summarizeModel(String modelo) {
        if (!nonEmpty(modelo)) return Mono.empty();

        String sql =
                "SELECT brand, modelo, color, condicion, anio, currency, monto_final, as_of_date, created_at " +
                        "FROM watches WHERE UPPER(modelo) = UPPER(:modelo)";

        return databaseClient.sql(sql)
                .bind("modelo", modelo.trim())
                .map((row, meta) -> new RowLite(row))
                .all()
                .collectList()
                .flatMap(rows -> {
                    if (rows.isEmpty()) return Mono.empty();

                    String brand = firstNotNull(rows.stream().map(r -> r.get("brand", String.class)).collect(Collectors.toList()));
                    Set<String> colors = rows.stream().map(r -> r.get("color", String.class)).filter(Objects::nonNull).collect(Collectors.toSet());
                    Set<String> conds  = rows.stream().map(r -> r.get("condicion", String.class)).filter(Objects::nonNull).collect(Collectors.toSet());
                    Set<Integer> anos  = rows.stream().map(r -> r.get("anio", Integer.class)).filter(Objects::nonNull).collect(Collectors.toSet());
                    LocalDate lastAsOf = rows.stream().map(r -> r.get("as_of_date", LocalDate.class)).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);

                    return Flux.fromIterable(rows)
                            .flatMap(r -> {
                                BigDecimal mf = r.get("monto_final", BigDecimal.class);
                                String curr   = r.get("currency", String.class);
                                LocalDate d   = r.get("as_of_date", LocalDate.class);
                                if (d == null) {
                                    LocalDateTime c = r.get("created_at", LocalDateTime.class);
                                    d = (c != null ? c.toLocalDate() : LocalDate.now());
                                }
                                if (mf == null || curr == null) return Mono.empty();
                                return exchangeRateService.convertToUSD(curr, mf.doubleValue(), d);
                            })
                            .collectList()
                            .map(usds -> {
                                double min = usds.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                                double max = usds.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                                double avg = usds.stream().mapToDouble(Double::doubleValue).average().orElse(0);

                                ModelSummary ms = new ModelSummary();
                                ms.setModelo(modelo);
                                ms.setBrand(brand);
                                ms.setColors(new ArrayList<String>(colors));
                                ms.setCondiciones(new ArrayList<String>(conds));
                                ms.setAnos(new ArrayList<Integer>(anos));
                                ms.setMinPriceUsd(min);
                                ms.setMaxPriceUsd(max);
                                ms.setAvgPriceUsd(avg);
                                ms.setLastAsOfDate(lastAsOf);
                                return ms;
                            });
                });
    }

    /* ======================
       DASHBOARD POR BRAND
       ====================== */
    public Mono<BrandDashboard> brandDashboard(String brand, WatchFilter extraFilters) {
        if (!nonEmpty(brand)) return Mono.empty();

        WatchFilter f = (extraFilters == null) ? new WatchFilter() : extraFilters;
        f.setBrand(brand);

        String where = buildWhere(f);
        Map<String, Object> params = buildParams(f);

        String sql =
                "SELECT brand, modelo, currency, monto_final, as_of_date, created_at " +
                        "FROM watches " + where;

        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> e : params.entrySet()) spec = spec.bind(e.getKey(), e.getValue());

        return spec.map((row, meta) -> new RowLite(row))
                .all()
                .collectList()
                .flatMap(rows -> {
                    long total = rows.size();
                    long distinctModels = rows.stream()
                            .map(r -> r.get("modelo", String.class))
                            .filter(Objects::nonNull)
                            .distinct()
                            .count();
                    LocalDate lastAs = rows.stream()
                            .map(r -> r.get("as_of_date", LocalDate.class))
                            .filter(Objects::nonNull)
                            .max(Comparator.naturalOrder())
                            .orElse(null);

                    return Flux.fromIterable(rows)
                            .flatMap(r -> {
                                BigDecimal mf = r.get("monto_final", BigDecimal.class);
                                String curr   = r.get("currency", String.class);
                                LocalDate date= r.get("as_of_date", LocalDate.class);
                                if (date == null) {
                                    LocalDateTime c = r.get("created_at", LocalDateTime.class);
                                    date = (c != null ? c.toLocalDate() : LocalDate.now());
                                }
                                if (mf == null || curr == null) return Mono.empty();
                                return exchangeRateService.convertToUSD(curr, mf.doubleValue(), date);
                            })
                            .collectList()
                            .map(usds -> {
                                double min = usds.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                                double max = usds.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                                double avg = usds.stream().mapToDouble(Double::doubleValue).average().orElse(0);

                                BrandDashboard bd = new BrandDashboard();
                                bd.setBrand(brand);
                                bd.setTotalWatches(total);
                                bd.setDistinctModels(distinctModels);
                                bd.setMinUsd(min);
                                bd.setMaxUsd(max);
                                bd.setAvgUsd(avg);
                                bd.setLastAsOfDate(lastAs);
                                return bd;
                            });
                });
    }

    /* ======================
       HISTORIAL DE PRECIOS
       ====================== */
    public Mono<List<WatchPriceHistoryResponse>> priceHistory(String modelo, int days) {
        if (!nonEmpty(modelo)) return Mono.just(Collections.<WatchPriceHistoryResponse>emptyList());
        LocalDateTime from = LocalDateTime.now().minusDays(Math.max(1, days));

        String sql =
                "SELECT created_at, monto_final, currency, as_of_date " +
                        "FROM watches " +
                        "WHERE UPPER(modelo) = UPPER(:modelo) AND created_at >= :from " +
                        "ORDER BY created_at ASC";

        return databaseClient.sql(sql)
                .bind("modelo", modelo.trim())
                .bind("from", from)
                .map((row, meta) -> new RowLite(row))
                .all()
                .flatMap(r -> {
                    BigDecimal mf = r.get("monto_final", BigDecimal.class);
                    String curr   = r.get("currency", String.class);
                    LocalDate date= r.get("as_of_date", LocalDate.class);
                    if (date == null) {
                        LocalDateTime c = r.get("created_at", LocalDateTime.class);
                        date = (c != null ? c.toLocalDate() : LocalDate.now());
                    }
                    if (mf == null || curr == null) return Mono.empty();
                    final LocalDate dateFx = date;
                    return exchangeRateService.convertToUSD(curr, mf.doubleValue(), dateFx)
                            .map(usd -> WatchPriceHistoryResponse.builder()
                                    .date(r.get("created_at", LocalDateTime.class).toLocalDate())
                                    .price(usd)
                                    .build());
                })
                .collectList();
    }

    /* ======================
       Helpers
       ====================== */

    private String buildWhere(WatchFilter f) {
        StringBuilder where = new StringBuilder(" WHERE 1=1 ");
        if (nonEmpty(f.getBrand()))     where.append(" AND UPPER(brand) = UPPER(:brand) ");
        if (nonEmpty(f.getModelo()))    where.append(" AND UPPER(modelo) = UPPER(:modelo) ");
        if (nonEmpty(f.getColor()))     where.append(" AND UPPER(color) = UPPER(:color) ");
        if (nonEmpty(f.getCondicion())) where.append(" AND UPPER(condicion) = UPPER(:condicion) ");
        if (nonEmpty(f.getBracelet()))  where.append(" AND UPPER(bracelet) = UPPER(:bracelet) ");
        if (f.getAnioFrom() != null)    where.append(" AND anio >= :anioFrom ");
        if (f.getAnioTo() != null)      where.append(" AND anio <= :anioTo ");
        if (f.getPriceMin() != null)    where.append(" AND monto_final >= :pmin ");
        if (f.getPriceMax() != null)    where.append(" AND monto_final <= :pmax ");
        if (nonEmpty(f.getCurrency()))  where.append(" AND UPPER(currency) = UPPER(:curr) ");
        if (nonEmpty(f.getText()))      where.append(" AND UPPER(clean_text) LIKE CONCAT('%', UPPER(:txt), '%') ");
        if (f.getAsOfFrom() != null)    where.append(" AND as_of_date >= :asFrom ");
        if (f.getAsOfTo() != null)      where.append(" AND as_of_date <= :asTo ");
        return where.toString();
    }

    private Map<String, Object> buildParams(WatchFilter f) {
        Map<String, Object> params = new HashMap<String, Object>();
        if (nonEmpty(f.getBrand()))     params.put("brand", f.getBrand().trim());
        if (nonEmpty(f.getModelo()))    params.put("modelo", f.getModelo().trim());
        if (nonEmpty(f.getColor()))     params.put("color", f.getColor().trim());
        if (nonEmpty(f.getCondicion())) params.put("condicion", f.getCondicion().trim());
        if (nonEmpty(f.getBracelet()))  params.put("bracelet", f.getBracelet().trim());
        if (f.getAnioFrom() != null)    params.put("anioFrom", f.getAnioFrom());
        if (f.getAnioTo() != null)      params.put("anioTo", f.getAnioTo());
        if (f.getPriceMin() != null)    params.put("pmin", f.getPriceMin());
        if (f.getPriceMax() != null)    params.put("pmax", f.getPriceMax());
        if (nonEmpty(f.getCurrency()))  params.put("curr", f.getCurrency().trim());
        if (nonEmpty(f.getText()))      params.put("txt", f.getText().trim());
        if (f.getAsOfFrom() != null)    params.put("asFrom", f.getAsOfFrom());
        if (f.getAsOfTo() != null)      params.put("asTo", f.getAsOfTo());
        return params;
    }

    private Mono<Map<String, Long>> countGroup(String col, String where, Map<String, Object> params) {
        String sql = "SELECT " + col + " AS k, COUNT(*) AS c FROM watches " + where + " GROUP BY " + col;
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> e : params.entrySet()) spec = spec.bind(e.getKey(), e.getValue());
        return spec.map((row, meta) -> Tuples.of(
                (String) Optional.ofNullable(row.get("k", String.class)).orElse("(null)"),
                ((Number) row.get("c")).longValue()
        )).all().collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    private Mono<Map<Integer, Long>> countGroupInt(String col, String where, Map<String, Object> params) {
        String sql = "SELECT " + col + " AS k, COUNT(*) AS c FROM watches " + where + " GROUP BY " + col;
        DatabaseClient.GenericExecuteSpec spec = databaseClient.sql(sql);
        for (Map.Entry<String, Object> e : params.entrySet()) spec = spec.bind(e.getKey(), e.getValue());
        return spec.map((row, meta) -> Tuples.of(
                row.get("k", Integer.class),
                ((Number) row.get("c")).longValue()
        )).all().collectMap(Tuple2::getT1, Tuple2::getT2);
    }

    private WatchEntity mapRow(io.r2dbc.spi.Row row) {
        WatchEntity.WatchEntityBuilder b = WatchEntity.builder();
        b.id(row.get("id", Long.class));
        b.fechaArchivo(row.get("fecha_archivo", LocalDate.class));
        b.cleanText(row.get("clean_text", String.class));
        b.brand(row.get("brand", String.class));
        b.modelo(row.get("modelo", String.class));
        b.currency(row.get("currency", String.class));
        b.monto(row.get("monto", BigDecimal.class));
        b.descuento(row.get("descuento", BigDecimal.class));
        b.montoFinal(row.get("monto_final", BigDecimal.class));
        b.estado(row.get("estado", String.class));
        b.condicion(row.get("condicion", String.class));
        b.anio(row.get("anio", Integer.class));
        b.bracelet(row.get("bracelet", String.class));
        b.color(row.get("color", String.class));
        b.asOfDate(row.get("as_of_date", LocalDate.class));
        b.createdAt(row.get("created_at", LocalDateTime.class));
        return b.build();
    }

    private static boolean nonEmpty(String s) { return s != null && !s.trim().isEmpty(); }

    private static <T> T firstNotNull(List<T> list) {
        for (T t : list) if (t != null) return t;
        return null;
    }

    private static class RowLite {
        private final io.r2dbc.spi.Row row;
        RowLite(io.r2dbc.spi.Row row) { this.row = row; }
        <T> T get(String col, Class<T> type) { return row.get(col, type); }
    }

    // ========= Helpers para FX / USD =========

    /** Selecciona la fecha a usar para FX: primero asOfDate, luego createdAt, luego hoy. */
    private LocalDate resolveFxDate(LocalDate asOf, LocalDateTime createdAt) {
        if (asOf != null) return asOf;
        if (createdAt != null) return createdAt.toLocalDate();
        return LocalDate.now();
    }

    /** Convierte monto_final de una entidad a USD y setea currency = "USD". */
    private Mono<WatchEntity> convertEntityToUsd(WatchEntity we) {
        BigDecimal mf = we.getMontoFinal();
        String curr   = we.getCurrency();
        if (mf == null || curr == null) {
            return Mono.just(we);
        }
        LocalDate fxDate = resolveFxDate(we.getAsOfDate(), we.getCreatedAt());
        return exchangeRateService.convertToUSD(curr, mf.doubleValue(), fxDate)
                .map(usd -> {
                    we.setMontoFinal(BigDecimal.valueOf(usd));
                    we.setCurrency("USD");
                    return we;
                });
    }
}
