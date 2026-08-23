package com.carlight.demo.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateCustomerRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phoneNumber;
}
