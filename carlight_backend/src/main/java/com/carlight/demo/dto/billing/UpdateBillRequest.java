package com.carlight.demo.dto.billing;

import com.carlight.demo.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateBillRequest {

    @NotNull
    private Long washPackageId;

    private List<Long> extraIds;
    private Double discount;

    @NotNull
    private PaymentMethod paymentMethod;
}