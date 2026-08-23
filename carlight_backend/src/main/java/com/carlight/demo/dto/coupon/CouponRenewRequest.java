package com.carlight.demo.dto.coupon;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CouponRenewRequest {

    /** New expiry date — must be today or later */
    private LocalDate validTill;

    /**
     * Optional: also reset the usage counter to 0.
     * Useful when a coupon died because maxUses was reached, not just expiry.
     */
    private Boolean resetUsage;

    /** Optional: change the maximum usage limit while renewing */
    private Integer maxUses;
}