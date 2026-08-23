package com.carlight.demo.controller.cashier;

import com.carlight.demo.dto.packagee.OutletPackageResponse;
import com.carlight.demo.entity.User;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.UserRepository;
import com.carlight.demo.service.OutletPackageService;
import com.carlight.demo.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cashier/outlet-packages")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CASHIER')")
public class CashierOutletPackageController {

    private final OutletPackageService outletPackageService;
    private final UserRepository userRepository;

    @GetMapping
    public List<OutletPackageResponse> myOutletPackages() {

        String phone = SecurityUtil.currentUserPhone();

        User cashier = userRepository.findByPhoneNumber(phone)
                .orElseThrow(() -> new BadRequestException("Cashier not found"));

        if (cashier.getOutlet() == null) {
            throw new BadRequestException("Cashier outlet not assigned");
        }

        return outletPackageService.getPackagesForOutlet(cashier.getOutlet().getId());
    }
}
