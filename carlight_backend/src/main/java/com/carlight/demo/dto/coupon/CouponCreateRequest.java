package com.carlight.demo.dto.coupon;

import com.carlight.demo.entity.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CouponCreateRequest {

    @NotBlank
    private String code;

    @NotNull
    private DiscountType discountType;

    @NotNull
    private Double discountValue;

    @NotNull
    private LocalDate validTill;

    // ✅ optional: global outlet coupon if null
    private Long outletId;

    // ✅ optional: if null => all cars
    private Long carId;

    // optional
    private Integer maxUses;

    // ✅ NEW: if true => coupon can be used only once per car
    private Boolean oncePerCar = false;

}
