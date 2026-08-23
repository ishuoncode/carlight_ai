package com.carlight.demo.service.impl;

import com.carlight.demo.dto.customer.CustomerActivityResponse;
import com.carlight.demo.dto.customer.CustomerActivityRow;
import com.carlight.demo.dto.customer.CustomerCreateRequest;
import com.carlight.demo.dto.customer.CustomerResponse;
import com.carlight.demo.entity.Car;
import com.carlight.demo.entity.Customer;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.BillRepository;
import com.carlight.demo.repository.CarRepository;
import com.carlight.demo.repository.CustomerRepository;
import com.carlight.demo.service.CustomerService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final BillRepository billRepository;
    private final CarRepository carRepository;

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) {

        String phone = request.getPhoneNumber().trim();
        String name = request.getName().trim();

        if (customerRepository.existsByPhoneNumber(phone)) {
            throw new BadRequestException("Customer already exists with phone number: " + phone);
        }

        Customer saved = customerRepository.save(
                Customer.builder()
                        .name(name)
                        .phoneNumber(phone)
                        .active(true)
                        .build()
        );

        return CustomerResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .phoneNumber(saved.getPhoneNumber())
                .active(saved.getActive())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    @Override
    public CustomerResponse findByPhone(String phoneNumber) {

        String phone = phoneNumber.trim();

        Customer customer = customerRepository.findByPhoneNumber(phone)
                .orElseThrow(() -> new BadRequestException("Customer not found with phone: " + phone));

        return toResponse(customer);
    }

    @Override
    public List<CustomerResponse> searchByName(String name) {

        String query = name.trim();

        return customerRepository.findByNameContainingIgnoreCaseOrderByNameAsc(query)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .phoneNumber(c.getPhoneNumber())
                .active(c.getActive())
                .createdAt(c.getCreatedAt())
                .build();
    }

    @Override
    public List<CustomerActivityResponse> getCustomerActivity(Long outletId) {

        // 1. Aggregate visits/spend per customer (computed in the DB — one query)
        List<CustomerActivityRow> rows = billRepository.customerActivityAggregates(outletId);

        if (rows.isEmpty()) {
            return List.of();
        }

        // 2. Outlet names each customer visited (one small grouped query)
        Map<Long, Set<String>> outletsByCustomer = new HashMap<>();
        for (Object[] row : billRepository.customerOutletBreakdown(outletId)) {
            Long customerId = ((Number) row[0]).longValue();
            String outletName = (String) row[1];
            outletsByCustomer.computeIfAbsent(customerId, k -> new HashSet<>()).add(outletName);
        }

        // 3. Cars per customer from the cars table (already fetched with owner)
        Map<Long, List<CustomerActivityResponse.CarInfo>> carsByCustomer = new HashMap<>();
        for (Car car : carRepository.findAllWithOwner()) {
            Long ownerId = car.getOwner().getId();
            carsByCustomer.computeIfAbsent(ownerId, k -> new ArrayList<>()).add(
                    CustomerActivityResponse.CarInfo.builder()
                            .carNo(car.getCarNo())
                            .carType(car.getCarType() != null ? car.getCarType().name() : null)
                            .model(car.getModel())
                            .build()
            );
        }

        // 4. Combine
        LocalDateTime now = LocalDateTime.now();
        return rows.stream()
                .map(row -> CustomerActivityResponse.builder()
                        .customerId(row.getCustomerId())
                        .name(row.getName())
                        .phoneNumber(row.getPhoneNumber())
                        .active(true)
                        .totalVisits(row.getTotalVisits())
                        .totalSpend(row.getTotalSpend())
                        .firstVisitDate(row.getFirstVisitDate())
                        .lastVisitDate(row.getLastVisitDate())
                        .daysSinceLastVisit(
                                row.getLastVisitDate() != null
                                        ? ChronoUnit.DAYS.between(row.getLastVisitDate(), now)
                                        : null
                        )
                        .outlets(new ArrayList<>(
                                outletsByCustomer.getOrDefault(row.getCustomerId(), Set.of())
                        ))
                        .cars(carsByCustomer.getOrDefault(row.getCustomerId(), List.of()))
                        .build())
                .toList();
    }

}
