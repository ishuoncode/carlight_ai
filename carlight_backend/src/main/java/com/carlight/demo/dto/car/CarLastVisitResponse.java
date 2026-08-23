package com.carlight.demo.dto.car;

import com.carlight.demo.entity.CarType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CarLastVisitResponse {

    private Long carId;
    private String carNo;

    private CarType carType;
    private String model;

    private Long customerId;
    private String customerName;
    private String phoneNumber;

    private LocalDateTime lastVisitAt;   // null if no bill
    private Long daysSinceLastVisit;     // null if no bill
}
