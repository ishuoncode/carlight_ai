package com.carlight.demo.dto.coupon;

import com.carlight.demo.entity.DiscountType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BestCouponResponse {

    private Boolean valid;
    private String message;

    private Long couponId;
    private String code;

    private Double totalBeforeDiscount;
    private Double couponDiscount;
    private Double manualDiscount;
    private Double finalPayable;

    private DiscountType discountType;
    private Double discountValue;
    private Boolean oncePerCar;

}
