package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.coupon.CouponCreateRequest;
import com.carlight.demo.dto.coupon.CouponRenewRequest;
import com.carlight.demo.dto.coupon.CouponResponse;
import com.carlight.demo.dto.coupon.CouponUsageUpdateRequest;
import com.carlight.demo.dto.coupon.CouponStatusRequest;
import com.carlight.demo.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class CouponAdminController {

    private final CouponService couponService;

    @PostMapping
    public CouponResponse create(@RequestBody @Valid CouponCreateRequest request) {
        return couponService.create(request);
    }

    @GetMapping
    public List<CouponResponse> all() {
        return couponService.getAll();
    }

    @GetMapping("/{id}")
    public CouponResponse get(@PathVariable Long id) {
        return couponService.getById(id);
    }

    @PatchMapping("/{id}/status")
    public CouponResponse status(@PathVariable Long id, @RequestBody @Valid CouponStatusRequest request) {
        return couponService.updateStatus(id, request.getActive());
    }

    // ✅ Renew an expired / exhausted coupon (new expiry + re-activate, optional usage reset / new limit)
    @PatchMapping("/{id}/renew")
    public CouponResponse renew(@PathVariable Long id, @RequestBody @Valid CouponRenewRequest request) {
        return couponService.renew(id, request.getValidTill(),
                Boolean.TRUE.equals(request.getResetUsage()), request.getMaxUses());
    }

    // ✅ Edit usage numbers of a live coupon (change max-uses limit and/or correct used count)
    @PatchMapping("/{id}/usage")
    public CouponResponse updateUsage(@PathVariable Long id, @RequestBody CouponUsageUpdateRequest request) {
        return couponService.updateUsage(id, request.getMaxUses(), request.getUsedCount());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        couponService.delete(id);
    }
}
