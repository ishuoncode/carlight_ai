package com.carlight.demo.service;

import com.carlight.demo.dto.outlet.OutletCreateRequest;
import com.carlight.demo.dto.outlet.OutletResponse;
import jakarta.validation.Valid;

import java.util.List;

public interface OutletService {
    OutletResponse createOutlet(@Valid OutletCreateRequest request);

    List<OutletResponse> fetchAllOutlet();
    OutletResponse fetchOutletById(Long outletId);

    /** Enable or disable an entire outlet */
    OutletResponse updateStatus(Long outletId, boolean active);

}
