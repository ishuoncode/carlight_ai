package com.carlight.demo.dto.coupon;

import com.carlight.demo.entity.DiscountType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class CouponResponse {

    private Long id;

    private String code;
    private DiscountType discountType;
    private Double discountValue;
    private LocalDate validTill;

    private Boolean active;

    private Integer maxUses;
    private Integer usedCount;

    private Long outletId;
    private String outletName;

    private Long carId;
    private String carNo;

    private  boolean oncePerCar;

    private LocalDateTime createdAt;
}
