package com.carlight.demo.controller;

import com.carlight.demo.dto.expense.ExpenseCreateRequest;
import com.carlight.demo.dto.expense.ExpensePieResponse;
import com.carlight.demo.dto.expense.UpdateExpenseRequest;
import com.carlight.demo.entity.Expense;
import com.carlight.demo.repository.ExpenseRepository;
import com.carlight.demo.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExpenseController {

    private final ExpenseService expenseService;
    private  final ExpenseRepository expenseRepository;

    // Add expense (ADMIN)
    @PostMapping
    public Expense create(@RequestBody @Valid ExpenseCreateRequest request,
                          Authentication authentication) {

        String adminEmail = authentication.getName();
        return expenseService.createExpense(request, adminEmail);
    }

    // Get all expenses
    @GetMapping
    public List<Expense> all() {
        return expenseService.getAllExpenses();
    }

    //  Get expenses by outlet
    @GetMapping("/outlet/{outletId}")
    public List<Expense> byOutlet(@PathVariable Long outletId) {
        return expenseService.getExpensesByOutlet(outletId);
    }

    @PutMapping("/{expenseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Expense updateExpense(
            @PathVariable Long expenseId,
            @RequestBody @Valid UpdateExpenseRequest request
    ) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        expense.setTitle(request.getTitle().trim());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setNotes(request.getNotes());

        return expenseRepository.save(expense);
    }

    @DeleteMapping("/{expenseId}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteExpensePermanently(@PathVariable Long expenseId) {
        expenseService.permanentDelete(expenseId);
    }

    @GetMapping("/range")
    public List<Expense> range(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            @RequestParam(required = false) Long outletId
    ) {
        return expenseService.getExpensesByDateRange(from, to, outletId);
    }



    // Monthly category pie chart
    @GetMapping("/pie/monthly")
    public List<ExpensePieResponse> monthlyPie(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long outletId
    ) {
        return expenseService.monthlyPie(year, month, outletId);
    }

    // Yearly category pie chart
    @GetMapping("/pie/yearly")
    public List<ExpensePieResponse> yearlyPie(
            @RequestParam int year,
            @RequestParam(required = false) Long outletId
    ) {
        return expenseService.yearlyPie(year, outletId);
    }

}
