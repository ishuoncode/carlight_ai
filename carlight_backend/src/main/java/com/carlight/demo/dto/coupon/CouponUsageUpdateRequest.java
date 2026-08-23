package com.carlight.demo.dto.coupon;

import lombok.Data;

@Data
public class CouponUsageUpdateRequest {

    /** New maximum usage limit (null = keep current) */
    private Integer maxUses;

    /** Manually corrected used counter (null = keep current) */
    private Integer usedCount;
}