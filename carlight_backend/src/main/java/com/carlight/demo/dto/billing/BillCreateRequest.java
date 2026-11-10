package com.carlight.demo.dto.billing;

import com.carlight.demo.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BillCreateRequest {



    @NotNull
    private Long outletId;

    @NotNull
    private Long customerId;

    @NotNull
    private Long carId;

    private Long outletPackageId; // optional — null for fast/manual-amount billing

    private Double discount;

    private List<Long> extraIds;

    

    @NotNull
    private PaymentMethod paymentMethod;

    private Long couponId;

    private List<AdditionalChargeRequest> additionalCharges;

    // ✅ manual amount used as the bill total for fast billing (no package price added)
    private Double manualAmount;

    @Data
    public static class AdditionalChargeRequest {
        private String title;
        private Double amount;
    }
}
