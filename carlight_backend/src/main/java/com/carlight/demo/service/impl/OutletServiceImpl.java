package com.carlight.demo.service.impl;

import com.carlight.demo.dto.outlet.OutletCreateRequest;
import com.carlight.demo.dto.outlet.OutletResponse;
import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.entity.CarType;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.OutletPackage;
import com.carlight.demo.entity.WashPackage;
import com.carlight.demo.repository.OutletPackageRepository;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.WashPackageRepository;
import com.carlight.demo.service.OutletService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OutletServiceImpl implements OutletService {

    private final OutletRepository outletRepository;
    private final WashPackageRepository washPackageRepository;
    private final OutletPackageRepository outletPackageRepository;

    @Override
    @Transactional
    public OutletResponse createOutlet(OutletCreateRequest request) {

        Outlet outlet = Outlet.builder()
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .active(true)
                .build();

        Outlet savedOutlet = outletRepository.save(outlet);

        // ✅ auto create outlet packages pricing rows
        List<WashPackage> washPackages = washPackageRepository.findAll();

        List<OutletPackage> createdPackages = new ArrayList<>();

        for (WashPackage wp : washPackages) {
            for (CarType carType : CarType.values()) {

                OutletPackage op = OutletPackage.builder()
                        .outlet(savedOutlet)
                        .washPackage(wp)
                        .carType(carType)
                        .price(0.0)     // default price
                        .active(true)
                        .build();

                createdPackages.add(outletPackageRepository.save(op));
            }
        }

        // ✅ convert created packages to response
        List<OutletPackageResponse> packageResponses = createdPackages.stream()
                .map(this::toPackageResponse)
                .toList();

        return OutletResponse.builder()
                .id(savedOutlet.getId())
                .name(savedOutlet.getName())
                .address(savedOutlet.getAddress())
                .active(savedOutlet.getActive())
                .createdAt(savedOutlet.getCreatedAt())
                .packages(packageResponses) // ✅ now included
                .build();
    }

    @Override
    public List<OutletResponse> fetchAllOutlet() {

        return outletRepository.findAll().stream().map(outlet -> {

            List<OutletPackageResponse> packages = outletPackageRepository
                    .findByOutlet_IdOrderByWashPackage_NameAscCarTypeAsc(outlet.getId())
                    .stream()
                    .map(this::toPackageResponse)
                    .toList();

            return OutletResponse.builder()
                    .id(outlet.getId())
                    .name(outlet.getName())
                    .address(outlet.getAddress())
                    .active(outlet.getActive())
                    .createdAt(outlet.getCreatedAt())
                    .packages(packages)   // ✅ included
                    .build();
        }).toList();
    }

    private OutletPackageResponse toPackageResponse(OutletPackage op) {
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

    @Override
    public OutletResponse fetchOutletById(Long outletId) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new RuntimeException("Outlet not found: " + outletId));

        var packages = outletPackageRepository
                .findByOutlet_IdOrderByWashPackage_NameAscCarTypeAsc(outlet.getId())
                .stream()
                .map(this::toPackageResponse)
                .toList();

        return OutletResponse.builder()
                .id(outlet.getId())
                .name(outlet.getName())
                .address(outlet.getAddress())
                .active(outlet.getActive())
                .createdAt(outlet.getCreatedAt())
                .packages(packages)
                .build();
    }

    @Override
    @Transactional
    public OutletResponse updateStatus(Long outletId, boolean active) {

        Outlet outlet = outletRepository.findById(outletId)
                .orElseThrow(() -> new RuntimeException("Outlet not found: " + outletId));

        outlet.setActive(active);
        Outlet saved = outletRepository.save(outlet);

        return OutletResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .address(saved.getAddress())
                .active(saved.getActive())
                .createdAt(saved.getCreatedAt())
                .build();
    }

}
