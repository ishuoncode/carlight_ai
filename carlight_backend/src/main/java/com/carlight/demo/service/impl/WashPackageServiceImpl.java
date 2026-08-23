package com.carlight.demo.service.impl;

import com.carlight.demo.dto.packagee.UpdateWashPackageRequest;
import com.carlight.demo.dto.packagee.WashPackageCreateRequest;
import com.carlight.demo.dto.packagee.WashPackageResponse;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.OutletPackage;
import com.carlight.demo.entity.WashPackage;
import com.carlight.demo.entity.CarType;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.OutletPackageRepository;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.WashPackageRepository;
import com.carlight.demo.service.WashPackageService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WashPackageServiceImpl implements WashPackageService {

    private final WashPackageRepository washPackageRepository;
    private final OutletRepository outletRepository;
    private final OutletPackageRepository outletPackageRepository;

    @Override
    @Transactional
    public WashPackageResponse create(WashPackageCreateRequest request) {

        String name = request.getName().trim();

        if (washPackageRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Wash package already exists: " + name);
        }

        WashPackage wp = WashPackage.builder()
                .name(name)
                .description(request.getDescription())
                .active(true)
                .build();

        WashPackage saved = washPackageRepository.save(wp);

        return toResponse(saved);
    }

    @Override
    public List<WashPackageResponse> getAll() {
        return washPackageRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WashPackageResponse update(Long id, UpdateWashPackageRequest request) {

        WashPackage wp = washPackageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Wash package not found"));

        // ✅ name validation (avoid duplicates)
        String newName = request.getName().trim();
        if (!wp.getName().equalsIgnoreCase(newName)
                && washPackageRepository.existsByNameIgnoreCase(newName)) {
            throw new RuntimeException("Wash package name already exists: " + newName);
        }

        wp.setName(newName);
        wp.setDescription(request.getDescription());
        wp.setActive(request.getActive());

        WashPackage saved = washPackageRepository.save(wp);

        return toResponse(saved);
    }
    private WashPackageResponse toResponse(WashPackage wp) {
        return WashPackageResponse.builder()
                .id(wp.getId())
                .name(wp.getName())
                .description(wp.getDescription())
                .active(wp.getActive())
                .createdAt(wp.getCreatedAt())
                .build();
    }

}
