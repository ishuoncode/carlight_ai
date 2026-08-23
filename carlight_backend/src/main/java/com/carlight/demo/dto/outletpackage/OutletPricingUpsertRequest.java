package com.carlight.demo.dto.outletpackage;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OutletPricingUpsertRequest {

    @NotEmpty
    private List<@Valid OutletPricingItem> prices;

    @NotNull
    private Boolean active;
}
