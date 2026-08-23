package com.carlight.demo.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CustomerCreateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phoneNumber;
}
