package com.carlight.demo.service;

import com.carlight.demo.dto.outletpackage.OutletPricingUpsertRequest;
import com.carlight.demo.dto.packagee.OutletPackageResponse;

import java.util.List;
import java.util.Map;

public interface OutletPackageService {
    Map<String, Object> upsertPricing(Long outletId, Long washPackageId, OutletPricingUpsertRequest request);

    OutletPackageResponse updateOutletPackagePrice(Long outletPackageId, Double price);
    List<OutletPackageResponse> getAllOutletPackages();
    List<OutletPackageResponse> getPackagesForOutlet(Long outletId);
    void updateStatus(Long outletPackageId, Boolean active);


}
