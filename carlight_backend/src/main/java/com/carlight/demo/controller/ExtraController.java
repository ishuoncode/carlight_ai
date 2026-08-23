package com.carlight.demo.controller;

import com.carlight.demo.dto.extra.ExtraCreateRequest;
import com.carlight.demo.dto.extra.ExtraResponse;
import com.carlight.demo.dto.extra.UpdateExtraRequest;
import com.carlight.demo.entity.Extra;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.ExtraRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/extras")
@RequiredArgsConstructor
public class ExtraController {

    private final ExtraRepository extraRepository;

    // ✅ Cashier/Admin both can use this (only active extras for billing)
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<ExtraResponse> activeExtras() {
        return extraRepository.findByActiveTrueOrderByNameAsc()
                .stream().map(this::toResponse).toList();
    }

    // ✅ Admin can see all extras
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<ExtraResponse> allExtras() {
        return extraRepository.findAllByOrderByNameAsc()
                .stream().map(this::toResponse).toList();
    }

    // ✅ Admin create extra
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ExtraResponse create(@RequestBody @Valid ExtraCreateRequest request) {

        String name = request.getName().trim();

        if (extraRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Extra already exists: " + name);
        }

        Extra extra = Extra.builder()
                .name(name)
                .price(request.getPrice())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return toResponse(extraRepository.save(extra));
    }

    // ✅ Admin update extra
    @PutMapping("/{extraId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ExtraResponse updateExtra(
            @PathVariable Long extraId,
            @RequestBody @Valid UpdateExtraRequest request
    ) {
        Extra extra = extraRepository.findById(extraId)
                .orElseThrow(() -> new BadRequestException("Extra not found: " + extraId));

        extra.setName(request.getName().trim());
        extra.setPrice(request.getPrice());
        extra.setActive(request.getActive());

        return toResponse(extraRepository.save(extra));
    }

    // ✅ Admin enable/disable extra
    @PatchMapping("/{extraId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ExtraResponse updateExtraStatus(
            @PathVariable Long extraId,
            @RequestParam Boolean active
    ) {

        Extra extra = extraRepository.findById(extraId)
                .orElseThrow(() -> new BadRequestException("Extra not found: " + extraId));

        extra.setActive(active);

        return toResponse(extraRepository.save(extra));
    }

    private ExtraResponse toResponse(Extra e) {
        return ExtraResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .price(e.getPrice())
                .active(e.getActive())
                .build();
    }
}
