package com.carlight.demo.dto.car;

import com.carlight.demo.entity.CarType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CarResponse {

    private Long id;
    private String carNo;
    private CarType carType;
    private String model;
    private Boolean active;
    private Boolean deleted;
    private LocalDateTime createdAt;

    private Long customerId;
    private String customerName;
    private String customerPhone;
}
