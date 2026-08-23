package com.carlight.demo.dto.coupon;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CouponStatusRequest {
    @NotNull
    private Boolean active;
}
