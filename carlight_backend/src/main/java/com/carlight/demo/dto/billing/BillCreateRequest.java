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

    @NotNull
    private Long outletPackageId;

    private Double discount;

    private List<Long> extraIds;

    

    @NotNull
    private PaymentMethod paymentMethod;

    private Long couponId;

    private List<AdditionalChargeRequest> additionalCharges;

    @Data
    public static class AdditionalChargeRequest {
        private String title;
        private Double amount;
    }
}
