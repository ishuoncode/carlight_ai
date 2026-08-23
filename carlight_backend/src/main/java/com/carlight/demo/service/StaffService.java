package com.carlight.demo.service;

import com.carlight.demo.dto.auth.RegisterRequest;
import com.carlight.demo.dto.user.StaffResponse;
import com.carlight.demo.dto.user.UpdateStaffPasswordRequest;
import com.carlight.demo.dto.user.UpdateStaffRequest;

import java.util.List;

public interface StaffService {

    StaffResponse addStaff(RegisterRequest request);

    List<StaffResponse> getAllStaff();

    StaffResponse updateStaff(Long staffId, UpdateStaffRequest request);

    void updateStaffPassword(Long staffId, UpdateStaffPasswordRequest request);

    void deleteStaff(Long staffId);
}
