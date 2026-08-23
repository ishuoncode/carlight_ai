package com.carlight.demo.dto.car;

import com.carlight.demo.entity.CarType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CarCreateRequest {

    @NotBlank
    private String carNo;

    @NotNull
    private CarType carType;

    private String model;

    @NotNull
    private Long customerId;
}
