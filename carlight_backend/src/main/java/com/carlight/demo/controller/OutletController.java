package com.carlight.demo.controller;

import com.carlight.demo.dto.outlet.OutletCreateRequest;
import com.carlight.demo.dto.outlet.OutletResponse;
import com.carlight.demo.service.OutletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/outlets")
@RequiredArgsConstructor
public class OutletController {

    private final OutletService outletService;

    // ✅ create outlet (ADMIN only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public OutletResponse createOutlet(@RequestBody @Valid OutletCreateRequest request) {
        return outletService.createOutlet(request);
    }

    // ✅ list outlets (ADMIN + CASHIER — needed for billing screens)
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<OutletResponse> allOutlets() {
        return outletService.fetchAllOutlet();
    }

    // ✅ enable / disable an entire outlet (ADMIN only)
    @PatchMapping("/{outletId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public OutletResponse updateStatus(@PathVariable Long outletId, @RequestParam Boolean active) {
        return outletService.updateStatus(outletId, active);
    }

    @GetMapping("/{outletId}")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public OutletResponse getOutletById(@PathVariable Long outletId) {
        return outletService.fetchOutletById(outletId);
    }
}
