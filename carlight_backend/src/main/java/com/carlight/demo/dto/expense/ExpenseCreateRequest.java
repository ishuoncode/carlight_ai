package com.carlight.demo.dto.expense;

import com.carlight.demo.entity.ExpenseCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExpenseCreateRequest {

    @NotNull
    private Long outletId;

    @NotBlank
    private String title;

    @NotNull
    @Positive
    private Double amount;

    @NotNull
    private ExpenseCategory category;

    private String notes;

    private LocalDateTime createdAt;
}
