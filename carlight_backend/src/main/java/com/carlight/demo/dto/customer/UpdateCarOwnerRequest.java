package com.carlight.demo.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCarOwnerRequest {

    @NotBlank
    private String carNo;

    // ✅ optional
    private String carModel;

    @NotBlank
    private String customerName;

    @NotBlank
    private String customerPhone;
}
