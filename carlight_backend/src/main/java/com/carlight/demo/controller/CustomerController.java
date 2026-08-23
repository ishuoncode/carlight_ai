package com.carlight.demo.controller;

import com.carlight.demo.dto.customer.CustomerActivityResponse;
import com.carlight.demo.dto.customer.CustomerCreateRequest;
import com.carlight.demo.dto.customer.CustomerResponse;


import com.carlight.demo.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    // ✅ Admin + Cashier can add customer
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public CustomerResponse create(@RequestBody @Valid CustomerCreateRequest request) {
        return customerService.createCustomer(request);
    }

    // ✅ Search by phone (exact)
    @GetMapping("/search/phone")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public CustomerResponse findByPhone(@RequestParam String phoneNumber) {
        return customerService.findByPhone(phoneNumber);
    }

    // ✅ Search by name (contains)
    @GetMapping("/search/name")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<CustomerResponse> searchByName(@RequestParam String name) {
        return customerService.searchByName(name);
    }

    // ✅ Customer visit analytics (recency filters, dormant-customer follow-up)
    // /api/customers/activity
    // /api/customers/activity?outletId=1
    @GetMapping("/activity")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<CustomerActivityResponse> activity(@RequestParam(required = false) Long outletId) {
        return customerService.getCustomerActivity(outletId);
    }

}
