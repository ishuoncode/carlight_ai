package com.carlight.demo.service;

import com.carlight.demo.dto.coupon.BestCouponRequest;
import com.carlight.demo.dto.coupon.BestCouponResponse;
import com.carlight.demo.dto.coupon.CouponCreateRequest;
import com.carlight.demo.dto.coupon.CouponResponse;

import java.time.LocalDate;
import java.util.List;

public interface CouponService {

    CouponResponse create(CouponCreateRequest request);

    List<CouponResponse> getAll();

    CouponResponse getById(Long id);

    CouponResponse updateStatus(Long id, boolean active);

    /**
     * Renew an existing (usually expired/exhausted) coupon:
     * extends its validity, re-activates it and optionally resets its usage counter
     * and/or changes the max usage limit.
     */
    CouponResponse renew(Long id, LocalDate validTill, boolean resetUsage, Integer maxUses);

    /**
     * Edit usage numbers of a live coupon: change the max-uses limit
     * and/or manually correct the used counter.
     */
    CouponResponse updateUsage(Long id, Integer maxUses, Integer usedCount);

    void delete(Long id); // optional permanent delete

    BestCouponResponse bestCoupon(BestCouponRequest request);

    List<CouponResponse> eligibleCoupons(Long outletId, Long carId);
    BestCouponResponse previewBestCoupon(BestCouponRequest request);
}
