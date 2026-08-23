package com.carlight.demo.service.impl;

import com.carlight.demo.dto.outletpackage.OutletPricingItem;
import com.carlight.demo.dto.outletpackage.OutletPricingUpsertRequest;
import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.entity.*;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.OutletPackageRepository;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.WashPackageRepository;
import com.carlight.demo.service.OutletPackageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OutletPackageServiceImpl implements OutletPackageService {

    private final OutletRepository outletRepository;
    private final WashPackageRepository washPackageRepository;
    private final OutletPackageRepository outletPackageRepository;

    @Override
    @Transactional
    public Map<String, Object> upsertPricing(Long outletId, Long washPackageId, OutletPricingUpsertRequest request) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new BadRequestException("Outlet not found: " + outletId));

        WashPackage washPackage = washPackageRepository.findById(washPackageId)
                .orElseThrow(() -> new BadRequestException("Wash package not found: " + washPackageId));

        int savedCount = 0;

        for (OutletPricingItem item : request.getPrices()) {

            CarType carType = item.getCarType();

            OutletPackage outletPackage = outletPackageRepository
                    .findByOutlet_IdAndWashPackage_IdAndCarType(outletId, washPackageId, carType)
                    .orElseGet(() -> OutletPackage.builder()
                            .outlet(outlet)
                            .washPackage(washPackage)
                            .carType(carType)
                            .build()
                    );

            outletPackage.setPrice(item.getPrice());
            outletPackage.setActive(request.getActive());

            outletPackageRepository.save(outletPackage);
            savedCount++;
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("outletId", outletId);
        resp.put("washPackageId", washPackageId);
        resp.put("savedCount", savedCount);
        resp.put("message", "Outlet pricing saved successfully");

        return resp;
    }
    @Override
    @Transactional
    public OutletPackageResponse updateOutletPackagePrice(Long outletPackageId, Double price) {

        if (price == null || price < 0) {
            throw new BadRequestException("Price must be >= 0");
        }

        OutletPackage outletPackage = outletPackageRepository.findById(outletPackageId)
                .orElseThrow(() -> new BadRequestException("OutletPackage not found: " + outletPackageId));

        outletPackage.setPrice(price);

        OutletPackage saved = outletPackageRepository.save(outletPackage);

        return toResponse(saved);
    }


    @Override
    public List<OutletPackageResponse> getAllOutletPackages() {
        return outletPackageRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Override
    public List<OutletPackageResponse> getPackagesForOutlet(Long outletId) {

        return outletPackageRepository
                .findByOutlet_IdAndActiveTrueOrderByWashPackage_NameAscCarTypeAsc(outletId)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    @Override
    @Transactional
    public void updateStatus(Long outletPackageId, Boolean active) {

        OutletPackage op = outletPackageRepository.findById(outletPackageId)
                .orElseThrow(() -> new BadRequestException("OutletPackage not found: " + outletPackageId));

        op.setActive(active);
        outletPackageRepository.save(op);
    }



    private OutletPackageResponse toResponse(OutletPackage op) {
        return OutletPackageResponse.builder()
                .id(op.getId())
                .outletId(op.getOutlet().getId())
                .outletName(op.getOutlet().getName())
                .washPackageId(op.getWashPackage().getId())
                .washPackageName(op.getWashPackage().getName())
                .carType(op.getCarType())
                .price(op.getPrice())
                .active(op.getActive())
                .build();
    }


}
