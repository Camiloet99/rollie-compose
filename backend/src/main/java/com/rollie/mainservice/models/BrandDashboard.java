package com.rollie.mainservice.models;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@lombok.Data
@lombok.Builder
@AllArgsConstructor
@NoArgsConstructor
public class BrandDashboard {
    private String brand;
    private long totalWatches;          // registros (filtrados)
    private long distinctModels;        // modelos distintos
    private double avgUsd;              // promedio USD (convertido)
    private double minUsd;
    private double maxUsd;
    private LocalDate lastAsOfDate;
}