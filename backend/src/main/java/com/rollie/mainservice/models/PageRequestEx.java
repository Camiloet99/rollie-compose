package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageRequestEx {
    private int page;      // 0-based
    private int size;      // máx 200
    private String sort;   // "date_desc", "price_asc", "price_desc", "brand_asc", ...
}
