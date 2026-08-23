package com.carlight.demo.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BestCouponRequest {

    @NotBlank
    private String code;

    @NotNull
    private Long outletId;

    @NotNull
    private Long carId;

    @NotNull
    private Long outletPackageId;

    // optional
    private List<Long> extraIds;

    // optional
    private List<AdditionalChargeRequest> additionalCharges;

    // optional manual discount (cashier/admin discount)
    private Double manualDiscount;

    @Data
    public static class AdditionalChargeRequest {
        private String title;
        private Double amount;
    }
}
