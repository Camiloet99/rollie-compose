package com.rollie.mainservice.services.facades;

import com.rollie.mainservice.services.facades.response.ExchangeRateCacheEntry;
import com.rollie.mainservice.services.facades.response.ExchangeRateResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import java.time.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private static final String API_KEY = "fxr_live_fda07c43403dcea681ac528b29ccf9806f1d";
    private static final String BASE_URL = "https://api.fxratesapi.com";

    private final WebClient webClient = WebClient.builder()
            .baseUrl(BASE_URL)
            .build();

    private final Map<String, ExchangeRateCacheEntry> cache = new ConcurrentHashMap<>();

    private static final Duration CACHE_DURATION = Duration.ofDays(2);

    public Mono<Double> convertToUSD(String fromCurrency, double amount, LocalDate date) {
        if ("USD".equalsIgnoreCase(fromCurrency) || "USDT".equalsIgnoreCase(fromCurrency)) {
            return Mono.just(amount);
        }

        String currency = fromCurrency.toUpperCase();
        String formattedDate = date.format(DateTimeFormatter.ISO_DATE);

        if(currency.equalsIgnoreCase("hk")) {
            currency = "HKD";
        }

        String cacheKey = currency + "|" + formattedDate;

        // Check cache first
        ExchangeRateCacheEntry cached = cache.get(cacheKey);
        if (cached != null && Instant.now().isBefore(cached.getExpiresAt())) {
            double converted = amount * cached.getRate();
            return Mono.just(converted);
        }

        // Otherwise, fetch from API
        String finalCurrency = currency;
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/convert")
                        .queryParam("from", finalCurrency)
                        .queryParam("to", "USD")
                        .queryParam("amount", amount)
                        .queryParam("date", formattedDate)
                        .queryParam("format", "json")
                        .queryParam("api_key", API_KEY)
                        .build())
                .retrieve()
                .bodyToMono(ExchangeRateResponse.class)
                .flatMap(response -> {
                    if (response.isSuccess() && response.getInfo() != null && response.getInfo().getRate() != null) {
                        double rate = response.getInfo().getRate();
                        double converted = response.getResult();

                        // Cache the rate for 2 days
                        cache.put(cacheKey, new ExchangeRateCacheEntry(rate, Instant.now().plus(CACHE_DURATION)));

                        return Mono.just(converted);
                    } else {
                        log.warn("Conversion failed from {} to USD. Response: {}", finalCurrency, response);
                        return Mono.just(amount);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Exception during conversion from {} to USD: {}", finalCurrency, e.getMessage(), e);
                    return Mono.just(amount); // fallback
                });
    }
}

