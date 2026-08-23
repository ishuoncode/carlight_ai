package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.outletpackage.OutletPricingUpsertRequest;
import com.carlight.demo.dto.outletpackage.UpdateOutletPackageStatusRequest;
import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.service.OutletPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/outlet-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class OutletPackageAdminController {

    private final OutletPackageService outletPackageService;

    @PostMapping("/outlets/{outletId}/wash-packages/{washPackageId}/pricing")
    public Map<String, Object> upsertPricing(
            @PathVariable Long outletId,
            @PathVariable Long washPackageId,
            @RequestBody @Valid OutletPricingUpsertRequest request
    ) {
        return outletPackageService.upsertPricing(outletId, washPackageId, request);
    }

    @GetMapping
    public List<OutletPackageResponse> getAllOutletPackages() {
        return outletPackageService.getAllOutletPackages();
    }

    @PatchMapping("/{outletPackageId}/status")
    public String updateStatus(
            @PathVariable Long outletPackageId,
            @RequestBody @Valid UpdateOutletPackageStatusRequest request
    ) {
        outletPackageService.updateStatus(outletPackageId, request.getActive());

        return request.getActive()
                ? "✅ Outlet package enabled successfully"
                : "✅ Outlet package disabled successfully";
    }
}
