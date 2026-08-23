package com.carlight.demo.dto.outlet;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OutletCreateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;
}
