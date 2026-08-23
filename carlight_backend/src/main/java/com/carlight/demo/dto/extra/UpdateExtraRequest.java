package com.carlight.demo.dto.extra;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpdateExtraRequest {

    @NotBlank
    private String name;

    @NotNull
    @Positive
    private Double price;

    @NotNull
    private Boolean active;
}
