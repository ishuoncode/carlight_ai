package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.service.OutletPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/outlets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
public class OutletPricingAdminController {

    private final OutletPackageService outletPackageService;

    // ✅ PARTICULAR OUTLET pricing
    @GetMapping("/{outletId}/outlet-packages")
    public List<OutletPackageResponse> outletPricing(@PathVariable Long outletId) {
        return outletPackageService.getPackagesForOutlet(outletId);
    }


}
