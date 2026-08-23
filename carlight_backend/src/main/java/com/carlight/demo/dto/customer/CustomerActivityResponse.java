package com.carlight.demo.dto.customer;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CustomerActivityResponse {

    private Long customerId;
    private String name;
    private String phoneNumber;
    private Boolean active;

    private Long totalVisits;
    private Double totalSpend;

    private LocalDateTime firstVisitDate;
    private LocalDateTime lastVisitDate;
    private Long daysSinceLastVisit;

    private List<String> outlets;
    private List<CarInfo> cars;

    @Data
    @Builder
    public static class CarInfo {
        private String carNo;
        private String carType;
        private String model;
    }
}