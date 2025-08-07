package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WatchReferenceSummaryResponse {
    private String referenceCode;
    private Double minPrice;
    private Double maxPrice;
    private List<String> conditions;
    private List<String> colors;
    private List<Integer> years;
    private LocalDateTime lastCreatedAt;
    private List<String> currencies;
    private List<String> extraInfo;
}