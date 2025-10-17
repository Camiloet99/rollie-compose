package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class WatchFilter {
    private String modelo;
    private String brand;
    private String bracelet;
    private String estado;
    private String color;
    private Integer anio;        // <-- exacto
    private Integer anioFrom;    // opcional
    private Integer anioTo;      // opcional
    private String condicion;
    private Double priceMin;
    private Double priceMax;
    private String currency;
    private String info;         // <-- alias de text que envía el front
    private String text;         // opcional (compat)
    private LocalDate asOfFrom;
    private LocalDate asOfTo;
}