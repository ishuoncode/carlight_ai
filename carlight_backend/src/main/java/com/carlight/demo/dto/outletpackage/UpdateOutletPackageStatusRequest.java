package com.carlight.demo.dto.outletpackage;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOutletPackageStatusRequest {
    @NotNull
    private Boolean active;
}
