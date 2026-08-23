package com.carlight.demo.dto.outletpackage;

import com.carlight.demo.entity.CarType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class OutletPricingItem {
    @NotNull
    private CarType carType;

    @NotNull
    @Positive
    private Double price;
}
