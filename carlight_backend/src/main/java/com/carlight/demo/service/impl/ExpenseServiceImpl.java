package com.carlight.demo.service.impl;

import com.carlight.demo.dto.expense.ExpenseCreateRequest;
import com.carlight.demo.dto.expense.ExpensePieResponse;
import com.carlight.demo.entity.Expense;
import com.carlight.demo.entity.Outlet;
import com.carlight.demo.entity.User;
import com.carlight.demo.repository.ExpenseRepository;
import com.carlight.demo.repository.OutletRepository;
import com.carlight.demo.repository.UserRepository;
import com.carlight.demo.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final OutletRepository outletRepository;
    private final UserRepository userRepository;

    @Override
    public Expense createExpense(ExpenseCreateRequest request, String adminPhone) {

        User admin = userRepository.findByPhoneNumber(adminPhone)
                .orElseThrow(() -> new RuntimeException("Admin not found with phone: " + adminPhone));

        if (admin.getRole() != com.carlight.demo.entity.Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can add expenses");
        }

        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new RuntimeException("Outlet not found with id: " + request.getOutletId()));

        Expense expense = Expense.builder()
                .outlet(outlet)
                .title(request.getTitle().trim())
                .amount(request.getAmount())
                .category(request.getCategory())
                .notes(request.getNotes())
                .addedBy(admin)
                .build();

        if (request.getCreatedAt() != null) {
            expense.setCreatedAt(request.getCreatedAt());
        }

        return expenseRepository.save(expense);
    }

    @Override
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    @Override
    public List<Expense> getExpensesByOutlet(Long outletId) {
        return expenseRepository.findByOutletId(outletId);
    }

    @Override
    public List<ExpensePieResponse> monthlyPie(int year, int month, Long outletId) {
        return expenseRepository.monthlyCategoryPie(year, month, outletId);
    }
    @Override
    public List<ExpensePieResponse> yearlyPie(int year, Long outletId) {
        return expenseRepository.yearlyCategoryPie(year, outletId);
    }

    public void permanentDelete(Long expenseId) {
        if (!expenseRepository.existsById(expenseId)) {
            throw new RuntimeException("Expense not found");
        }
        expenseRepository.deleteById(expenseId); // ✅ hard delete
    }

    @Override
    public List<Expense> getExpensesByDateRange(LocalDate from, LocalDate to, Long outletId) {

        if (from == null || to == null) {
            throw new RuntimeException("from and to dates are required");
        }

        if (to.isBefore(from)) {
            throw new RuntimeException("to date cannot be before from date");
        }

        var start = from.atStartOfDay();
        var end = to.plusDays(1).atStartOfDay().minusSeconds(1);

        if (outletId == null) {
            return expenseRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        }

        return expenseRepository.findByOutlet_IdAndCreatedAtBetweenOrderByCreatedAtDesc(outletId, start, end);
    }


}
