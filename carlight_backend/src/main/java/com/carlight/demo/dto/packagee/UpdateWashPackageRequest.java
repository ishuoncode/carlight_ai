package com.carlight.demo.dto.packagee;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateWashPackageRequest {

    @NotBlank
    private String name;

    private String description;



    @NotNull
    private Boolean active;
}
