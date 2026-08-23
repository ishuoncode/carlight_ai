package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.packagee.UpdateWashPackageRequest;
import com.carlight.demo.dto.packagee.WashPackageCreateRequest;
import com.carlight.demo.dto.packagee.WashPackageResponse;
import com.carlight.demo.service.WashPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/wash-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WashPackageAdminController {

    private final WashPackageService washPackageService;

    @PostMapping
    public WashPackageResponse create(@RequestBody @Valid WashPackageCreateRequest request) {
        return washPackageService.create(request);
    }

    @GetMapping
    public List<WashPackageResponse> getAll() {
        return washPackageService.getAll();
    }

    @PutMapping("/{id}")
    public WashPackageResponse update(
            @PathVariable Long id,
            @RequestBody @Valid UpdateWashPackageRequest request
    ) {
        return washPackageService.update(id, request);
    }

}
