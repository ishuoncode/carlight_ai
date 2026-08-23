package com.carlight.demo.controller.admin;

import com.carlight.demo.dto.auth.RegisterRequest;
import com.carlight.demo.dto.user.StaffResponse;
import com.carlight.demo.dto.user.UpdateStaffPasswordRequest;
import com.carlight.demo.dto.user.UpdateStaffRequest;
import com.carlight.demo.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StaffAdminController {

    private final StaffService staffService;

    // ✅ Add Staff
    @PostMapping
    public StaffResponse addStaff(@RequestBody @Valid RegisterRequest request) {
        return staffService.addStaff(request);
    }

    // ✅ List Staff
    @GetMapping
    public List<StaffResponse> getAllStaff() {
        return staffService.getAllStaff();
    }

    // ✅ Update Staff
    @PutMapping("/{staffId}")
    public StaffResponse updateStaff(
            @PathVariable Long staffId,
            @RequestBody @Valid UpdateStaffRequest request
    ) {
        return staffService.updateStaff(staffId, request);
    }

    // ✅ Update Staff Password
    @PatchMapping("/{staffId}/password")
    public String updateStaffPassword(
            @PathVariable Long staffId,
            @RequestBody @Valid UpdateStaffPasswordRequest request
    ) {
        staffService.updateStaffPassword(staffId, request);
        return "✅ Password updated successfully";
    }

    @DeleteMapping("/{staffId}")
    public String deleteStaff(@PathVariable Long staffId) {
        staffService.deleteStaff(staffId);
        return "✅ Staff deleted (disabled) successfully";
    }
}
