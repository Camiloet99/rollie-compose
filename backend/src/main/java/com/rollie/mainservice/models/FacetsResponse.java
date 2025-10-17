package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacetsResponse {
    private java.util.Map<String, Long> byBrand;
    private java.util.Map<String, Long> byColor;
    private java.util.Map<String, Long> byCondicion;
    private java.util.Map<String, Long> byBracelet;
    private java.util.Map<Integer, Long> byAnio;
}
