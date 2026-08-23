package com.carlight.demo.dto.expense;

import com.carlight.demo.entity.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ExpensePieResponse {
    private ExpenseCategory category;
    private Double total;
}
