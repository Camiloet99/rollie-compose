package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.*;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.services.WatchQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/watches")
@RequiredArgsConstructor
public class WatchController {

    private final WatchQueryService watchQueryService;

    @PostMapping("/query")
    public Mono<ResponseEntity<ResponseBody<PageResult<WatchEntity>>>> query(
            @RequestBody WatchFilter filter,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @RequestParam(name = "sort", defaultValue = "date_desc") String sort,
            @RequestParam(name = "window", required = false) String window,
            @RequestParam(name = "avgMode", required = false) String avgMode
    ) {
        PageRequestEx req = new PageRequestEx(page, size, sort);

        if (window != null && !window.trim().isEmpty()) {
            return watchQueryService
                    .averageByWindow(filter, window.trim().toLowerCase(), req, avgMode) // NEW
                    .map(ControllerUtils::ok);
        }

        return watchQueryService.search(filter, req)
                .map(ControllerUtils::ok);
    }

    /**
     * Facetas (brand, modelo, color, condicion, bracelet, rangos de año y precio, monedas, etc.)
     * Útil para poblar filtros del frontend.
     */
    @PostMapping("/facets")
    public Mono<ResponseEntity<ResponseBody<FacetsResponse>>> facets(
            @RequestBody(required = false) WatchFilter filter
    ) {
        return watchQueryService.facets(filter)
                .map(ControllerUtils::ok);
    }

    /**
     * Resumen de un modelo: min/max precio, condiciones, colores, años,
     * última fecha de carga y monedas presentes.
     */
    @GetMapping("/summary/{modelo}")
    public Mono<ResponseEntity<ResponseBody<ModelSummary>>> summarizeModel(
            @PathVariable("modelo") String modelo
    ) {
        return watchQueryService.summarizeModel(modelo)
                .map(ControllerUtils::ok);
    }

    /**
     * Dashboard por marca: top modelos, stats de precio por día, condiciones más comunes, etc.
     * Puedes pasar filtros adicionales en el body (e.g. por rango de fechas o moneda).
     */
    @PostMapping("/brand-dashboard/{brand}")
    public Mono<ResponseEntity<ResponseBody<BrandDashboard>>> brandDashboard(
            @PathVariable("brand") String brand,
            @RequestBody(required = false) WatchFilter extraFilters
    ) {
        return watchQueryService.brandDashboard(brand, extraFilters)
                .map(ControllerUtils::ok);
    }

    /**
     * Historial de precios (últimos N días) para un modelo específico.
     * Por defecto days=5.
     */
    @GetMapping("/price-history")
    public Mono<ResponseEntity<ResponseBody<List<WatchPriceHistoryResponse>>>> priceHistory(
            @RequestParam("modelo") String modelo,
            @RequestParam(name = "days", defaultValue = "5") int days
    ) {
        return watchQueryService.priceHistory(modelo, days)
                .map(ControllerUtils::ok);
    }

    /** =========================
     *  Autocomplete (modelo / brand / referencia)
     *  ========================= */
    @GetMapping("/autocomplete")
    public Mono<ResponseEntity<ResponseBody<List<String>>>> autocomplete(
            @RequestParam("prefix") String prefix
    ) {
        return watchQueryService.autocomplete(prefix)
                .map(ControllerUtils::ok);
    }
}