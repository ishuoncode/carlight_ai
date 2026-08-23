package com.carlight.demo.controller;

import com.carlight.demo.entity.Role;
import com.carlight.demo.entity.CarType;
import com.carlight.demo.entity.ExpenseCategory;
import com.carlight.demo.entity.PaymentMethod;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/meta")
@PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
public class MetaController {

    @GetMapping("/enums")
    public Map<String, Object> enums() {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("roles", Role.values());
        map.put("carTypes", CarType.values());
        map.put("paymentMethods", PaymentMethod.values());
        map.put("expenseCategories", ExpenseCategory.values());

        return map;
    }
}
