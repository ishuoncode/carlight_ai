package com.carlight.demo.controller;

import com.carlight.demo.dto.auth.AuthResponse;
import com.carlight.demo.dto.auth.LoginRequest;
import com.carlight.demo.entity.User;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.UserRepository;
import com.carlight.demo.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import com.carlight.demo.dto.auth.RegisterRequest;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.Role;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final OutletRepository outletRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {

        String phone = request.getPhoneNumber().trim();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(phone, request.getPassword())
        );

        User user = userRepository.findByPhoneNumber(phone).orElseThrow();

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .id(user.getId())
                .token(token)
                .role(user.getRole().name())
                .outletId(user.getOutlet() != null ? user.getOutlet().getId() : null)
                .name(user.getName())
                .phoneNumber(user.getPhoneNumber())
                .build();
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public User register(@RequestBody @Valid RegisterRequest request) {

        String phone = request.getPhoneNumber().trim();

        if (userRepository.existsByPhoneNumber(phone)) {
            throw new RuntimeException("Phone number already exists");
        }

        Outlet outlet = null;

        if (request.getRole() == Role.CASHIER) {
            if (request.getOutletId() == null) {
                throw new RuntimeException("Cashier must belong to an outlet");
            }
            outlet = outletRepository.findById(request.getOutletId())
                    .orElseThrow(() -> new RuntimeException("Outlet not found"));
        }

        User user = User.builder()
                .name(request.getName().trim())
                .phoneNumber(phone)
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .password(passwordEncoder.encode(request.getPassword())) // ✅ bcrypt
                .role(request.getRole())
                .outlet(outlet)
                .active(true)
                .build();

        return userRepository.save(user);
    }

}
