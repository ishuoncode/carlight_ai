package com.carlight.demo.dto.packagee;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateOutletPackagePriceRequest {

    @NotNull
    @Positive
    private Double price;
}
