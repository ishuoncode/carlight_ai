package com.carlight.demo.service;

import com.carlight.demo.dto.customer.CustomerActivityResponse;
import com.carlight.demo.dto.customer.CustomerCreateRequest;
import com.carlight.demo.dto.customer.CustomerResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(CustomerCreateRequest request);

    CustomerResponse findByPhone(String phoneNumber);
    List<CustomerResponse> searchByName(String name);

    /**
     * Per-customer visit analytics: total visits, total spend, first/last visit,
     * cars and outlets — used by the dashboard "Customer Insights" view to
     * filter customers by recency (e.g. visited within 3 / 6 months) and to
     * find long-absent customers for personal follow-up.
     */
    List<CustomerActivityResponse> getCustomerActivity(Long outletId);
}
