package com.carlight.demo.dto.packagee;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WashPackageCreateRequest {

    @NotBlank
    private String name;

    private String description;
}
