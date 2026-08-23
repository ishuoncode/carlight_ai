package com.carlight.demo.dto.car;

import com.carlight.demo.entity.CarType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCarRequest {

    @NotBlank
    private String carNo;

    private CarType carType;
    private String model;
}
