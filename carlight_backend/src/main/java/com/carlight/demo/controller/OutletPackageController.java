package com.carlight.demo.controller;

import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.dto.packagee.UpdateOutletPackagePriceRequest;
import com.carlight.demo.service.OutletPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/outlet-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class OutletPackageController {

    private final OutletPackageService outletPackageService;

    // ✅ Get all outlet packages by outletId
    @GetMapping("/outlets/{outletId}")
    public List<OutletPackageResponse> getByOutlet(@PathVariable Long outletId) {
        return outletPackageService.getPackagesForOutlet(outletId);
    }

    // ✅ Update price of single outletPackage row
    @PutMapping("/{outletPackageId}/price")
    public OutletPackageResponse updatePrice(
            @PathVariable Long outletPackageId,
            @RequestBody @Valid UpdateOutletPackagePriceRequest request
    ) {
        return outletPackageService.updateOutletPackagePrice(outletPackageId, request.getPrice());
    }


}
