package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class ModelSummary {
    private String modelo;
    private String brand;
    private java.util.List<String> colors;
    private java.util.List<String> condiciones;
    private java.util.List<Integer> anos;
    private double minPriceUsd;
    private double maxPriceUsd;
    private double avgPriceUsd;
    private LocalDate lastAsOfDate;
}
