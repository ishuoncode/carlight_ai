package com.carlight.demo.service;

import com.carlight.demo.dto.expense.ExpenseCreateRequest;
import com.carlight.demo.dto.expense.ExpensePieResponse;
import com.carlight.demo.entity.Expense;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseService {

    Expense createExpense(ExpenseCreateRequest request, String adminEmail);

    List<Expense> getAllExpenses();

    List<Expense> getExpensesByOutlet(Long outletId);

    List<Expense> getExpensesByDateRange(LocalDate from, LocalDate to, Long outletId);


    void permanentDelete(Long expenseId);

    List<ExpensePieResponse> monthlyPie(int year, int month, Long outletId);
    List<ExpensePieResponse> yearlyPie(int year, Long outletId);
}
