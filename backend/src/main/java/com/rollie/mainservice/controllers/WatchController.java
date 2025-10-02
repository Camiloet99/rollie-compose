package com.rollie.mainservice.controllers;

import com.rollie.mainservice.entities.WatchEntity;
import com.rollie.mainservice.models.PageResult;
import com.rollie.mainservice.models.ResponseBody;
import com.rollie.mainservice.models.WatchPriceHistoryResponse;
import com.rollie.mainservice.models.WatchReferenceSummaryResponse;
import com.rollie.mainservice.models.requests.WatchReferencesRequest;
import com.rollie.mainservice.models.requests.WatchSearchRequest;
import com.rollie.mainservice.services.SearchService;
import com.rollie.mainservice.services.WatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/watches")
@RequiredArgsConstructor
public class WatchController {

    private final WatchService watchService;
    private final SearchService searchService;

    @GetMapping("/{reference}/window/{window}")
    public Mono<ResponseEntity<ResponseBody<List<WatchEntity>>>> getWatchByReference(
            @PathVariable String reference,
            @RequestParam Long userId,
            @PathVariable(required = false) String window
    ) {
        return searchService.validateSearchLimit(userId)
                .then(watchService.getWatchByReference(reference, window))
                .flatMap(results -> Mono.defer(() ->
                        searchService.logSearch(userId, reference)
                                .thenReturn(ControllerUtils.ok(results))
                ));
    }

    @GetMapping("/{reference}")
    public Mono<ResponseEntity<ResponseBody<PageResult<WatchEntity>>>> getWatchByReference(
            @PathVariable String reference,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return searchService.validateSearchLimit(userId)
                .then(watchService.getWatchByReference(reference, page, size))
                .flatMap(pageResult -> Mono.defer(() ->
                        searchService.logSearch(userId, reference)
                                .thenReturn(ControllerUtils.ok(pageResult))
                ));
    }

    @PostMapping("/by-references")
    public Mono<ResponseEntity<ResponseBody<List<WatchEntity>>>> getWatchesByReferences(
            @RequestBody WatchReferencesRequest request
    ) {
        return watchService.getWatchesByReferences(request.getReferences())
                .map(ControllerUtils::ok);
    }

    @GetMapping("/price-range")
    public Mono<ResponseEntity<ResponseBody<List<WatchEntity>>>> findByPriceRange(
            @RequestParam("min") Double min,
            @RequestParam("max") Double max
    ) {
        return watchService.findWatchesByPriceRange(min, max)
                .map(ControllerUtils::ok);
    }

    @GetMapping("/price-history")
    public Mono<ResponseEntity<ResponseBody<List<WatchPriceHistoryResponse>>>> getPriceHistory(
            @RequestParam String reference
    ) {
        return watchService.getPriceHistory(reference)
                .map(ControllerUtils::ok);
    }

    @GetMapping("/autocomplete")
    public Mono<ResponseEntity<ResponseBody<List<String>>>> autocomplete(@RequestParam String prefix) {
        return watchService.autocompleteReference(prefix)
                .map(ControllerUtils::ok);
    }

    @GetMapping("/summary/{reference}")
    public Mono<ResponseEntity<ResponseBody<WatchReferenceSummaryResponse>>> getWatchSummaryByReference(
            @PathVariable String reference
    ) {
        return watchService.getWatchSummaryByReference(reference)
                .map(ControllerUtils::ok);
    }

}
