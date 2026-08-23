package com.carlight.demo.dto.customer;

import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Flat projection row produced by the BillRepository aggregate query.
 * One row per customer with their visit aggregates computed in the database.
 */
@Getter
public class CustomerActivityRow {

    private final Long customerId;
    private final String name;
    private final String phoneNumber;
    private final Long totalVisits;
    private final Double totalSpend;
    private final LocalDateTime firstVisitDate;
    private final LocalDateTime lastVisitDate;

    public CustomerActivityRow(Long customerId,
                               String name,
                               String phoneNumber,
                               Long totalVisits,
                               Double totalSpend,
                               LocalDateTime firstVisitDate,
                               LocalDateTime lastVisitDate) {
        this.customerId = customerId;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.totalVisits = totalVisits;
        this.totalSpend = totalSpend;
        this.firstVisitDate = firstVisitDate;
        this.lastVisitDate = lastVisitDate;
    }
}