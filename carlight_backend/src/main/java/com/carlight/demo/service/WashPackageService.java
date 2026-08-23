package com.carlight.demo.service;

import com.carlight.demo.dto.packagee.UpdateWashPackageRequest;
import com.carlight.demo.dto.packagee.WashPackageCreateRequest;
import com.carlight.demo.dto.packagee.WashPackageResponse;

import java.util.List;

public interface WashPackageService {
    WashPackageResponse create(WashPackageCreateRequest request);
    List<WashPackageResponse> getAll();
    WashPackageResponse update(Long id, UpdateWashPackageRequest request);

}
