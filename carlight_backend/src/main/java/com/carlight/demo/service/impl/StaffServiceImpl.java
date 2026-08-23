package com.carlight.demo.service.impl;

import com.carlight.demo.dto.auth.RegisterRequest;
import com.carlight.demo.dto.user.StaffResponse;
import com.carlight.demo.dto.user.UpdateStaffPasswordRequest;
import com.carlight.demo.dto.user.UpdateStaffRequest;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.Role;
import com.carlight.demo.entity.User;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.UserRepository;
import com.carlight.demo.service.StaffService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffServiceImpl implements StaffService {

    private final UserRepository userRepository;
    private final OutletRepository outletRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public StaffResponse addStaff(RegisterRequest request) {

        String phone = request.getPhoneNumber().trim();

        if (userRepository.existsByPhoneNumber(phone)) {
            throw new BadRequestException("Phone number already exists: " + phone);

        }

        Outlet outlet = resolveOutlet(request.getRole(), request.getOutletId());

        User user = User.builder()
                .name(request.getName().trim())
                .phoneNumber(phone)
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .outlet(outlet)
                .active(true)
                .build();

        return toResponse(userRepository.save(user));
    }

    @Override
    public List<StaffResponse> getAllStaff() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public StaffResponse updateStaff(Long staffId, UpdateStaffRequest request) {

        User user = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        if (request.getName() != null) user.setName(request.getName().trim());
        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getRole() != null) user.setRole(request.getRole());

        // outlet change
        if (request.getOutletId() != null) {
            Outlet outlet = outletRepository.findById(request.getOutletId())
                    .orElseThrow(() -> new RuntimeException("Outlet not found"));
            user.setOutlet(outlet);
        }

        // if role ADMIN -> outlet must be null
        if (user.getRole() == Role.ADMIN) {
            user.setOutlet(null);
        }

        // if role CASHIER but outlet not assigned -> invalid
        if (user.getRole() == Role.CASHIER && user.getOutlet() == null) {
            throw new RuntimeException("Cashier must belong to an outlet");
        }

        return toResponse(userRepository.save(user));
    }

    @Override
    public void updateStaffPassword(Long staffId, UpdateStaffPasswordRequest request) {

        User user = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ---------------- HELPER METHODS ----------------

    private Outlet resolveOutlet(Role role, Long outletId) {

        if (role == Role.ADMIN) return null;

        if (role == Role.CASHIER) {
            if (outletId == null) {
                throw new RuntimeException("Cashier must belong to an outlet");
            }

            return outletRepository.findById(outletId)
                    .orElseThrow(() -> new RuntimeException("Outlet not found"));
        }

        return null;
    }

    private StaffResponse toResponse(User user) {
        return StaffResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .role(user.getRole())
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .outletName(user.getOutlet() != null ? user.getOutlet().getName() : null)
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    public void deleteStaff(Long staffId) {

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // ✅ prevent deleting admin (optional rule)
        if (staff.getRole() == Role.ADMIN) {
            throw new RuntimeException("Admin staff cannot be deleted");
        }

        staff.setActive(false); // ✅ soft delete
        userRepository.save(staff);
    }

}
