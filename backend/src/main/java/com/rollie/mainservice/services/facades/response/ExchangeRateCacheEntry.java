package com.rollie.mainservice.services.facades.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class ExchangeRateCacheEntry {
    private double rate;
    private Instant expiresAt;
}
