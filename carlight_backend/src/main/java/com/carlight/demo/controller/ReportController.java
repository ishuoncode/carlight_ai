package com.carlight.demo.controller;

import com.carlight.demo.dto.billing.TotalCarServiceResponse;
import com.carlight.demo.dto.report.YearlyCarServiceReport;
import com.carlight.demo.service.impl.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    // /api/reports/cars-serviced/monthly?year=2026&month=1
    @GetMapping("/cars-serviced/monthly")
    public TotalCarServiceResponse carsServicedMonthly(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long outletId
    ) {
        return reportService.monthlyCarsServiced(year, month, outletId);
    }


    // /api/reports/cars-serviced/yearly?year=2026
    @GetMapping("/cars-serviced/yearly")
    public TotalCarServiceResponse carsServicedYearly(
            @RequestParam int year,
            @RequestParam(required = false) Long outletId
    ) {
        return reportService.yearlyCarsServiced(year, outletId);
    }

    // ✅ all years report
    // /api/reports/cars-serviced/all-years
    // /api/reports/cars-serviced/all-years?outletId=1
    @GetMapping("/cars-serviced/all-years")
    public List<YearlyCarServiceReport> carsServicedAllYears(
            @RequestParam(required = false) Long outletId
    ) {
        return reportService.carsServicedAllYears(outletId);
    }





}
