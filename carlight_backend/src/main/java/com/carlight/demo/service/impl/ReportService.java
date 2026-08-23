package com.carlight.demo.service.impl;

import com.carlight.demo.dto.billing.TotalCarServiceResponse;
import com.carlight.demo.dto.report.YearlyCarServiceReport;
import com.carlight.demo.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BillRepository billRepository;

    public TotalCarServiceResponse monthlyCarsServiced(int year, int month, Long outletId) {
        return new TotalCarServiceResponse(
                billRepository.monthlyCarsServiced(year, month, outletId)
        );
    }

    public TotalCarServiceResponse yearlyCarsServiced(int year, Long outletId) {
        return new TotalCarServiceResponse(
                billRepository.yearlyCarsServiced(year, outletId)
        );
    }

    public List<YearlyCarServiceReport> carsServicedAllYears(Long outletId) {
        return billRepository.carsServicedAllYears(outletId);
    }

}

