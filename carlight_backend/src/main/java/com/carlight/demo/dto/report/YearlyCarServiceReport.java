package com.carlight.demo.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class YearlyCarServiceReport {
    private Integer year;
    private Long totalCars;
}
