package com.carlight.demo.dto.analytics;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalyticsSummaryResponse {

    private Long outletId; // null => all outlets
    private String period; // DAY/MONTH/YEAR
    private String value;  // "2026-01-16" OR "2026-01" OR "2026"

    private Long totalCars;
    private Double totalIncome;
    private Double totalExpense;
    private Double profit;
}
