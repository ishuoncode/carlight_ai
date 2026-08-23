package com.carlight.demo.controller;

import com.carlight.demo.dto.coupon.BestCouponRequest;
import com.carlight.demo.dto.coupon.BestCouponResponse;
import com.carlight.demo.dto.coupon.CouponResponse;
import com.carlight.demo.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponPublicController {

    private final CouponService couponService;

    // ✅ Frontend billing preview
    @PostMapping("/best")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public BestCouponResponse bestCoupon(@RequestBody @Valid BestCouponRequest request) {
        return couponService.previewBestCoupon(request);
    }

    @GetMapping("/eligible")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<CouponResponse> eligibleCoupons(
            @RequestParam Long outletId,
            @RequestParam Long carId
    ) {
        return couponService.eligibleCoupons(outletId, carId);
    }

}
