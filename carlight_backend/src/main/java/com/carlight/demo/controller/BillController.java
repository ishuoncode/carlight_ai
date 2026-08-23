package com.carlight.demo.controller;

import com.carlight.demo.dto.billing.BillCreateRequest;
import com.carlight.demo.dto.billing.BillResponse;
import com.carlight.demo.dto.billing.BillYearResponse;
import com.carlight.demo.dto.billing.TotalBillResponse;
import com.carlight.demo.service.BillService;
import com.carlight.demo.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public BillResponse createBill(@RequestBody @Valid BillCreateRequest request) {

        // logged-in user's phone comes from JWT subject
        String phone = SecurityUtil.currentUserPhone();

        return billService.createBill(request, phone);
    }


    @DeleteMapping("/{billId}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    public void permanentDelete(@PathVariable Long billId) {
        billService.permanentDeleteBill(billId);
    }



    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<BillResponse> getAllBills(@PathVariable Long staffId) {
        return billService.getAllBillsByStaffID(staffId);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<BillResponse> getAllBills() {
        return billService.getAllBills();
    }

    // ✅ Fetch bill by id (ADMIN + CASHIER)
    @GetMapping("/{billId}")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public BillResponse getBillById(@PathVariable Long billId) {
        return billService.getBillById(billId);
    }

    // ✅ Bills by outlet (ADMIN only)
    @GetMapping("/outlet/{outletId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BillResponse> billsByOutlet(@PathVariable Long outletId) {
        return billService.getBillsByOutlet(outletId);
    }

    // ✅ Bills by date (ADMIN only) - outletId optional
    @GetMapping("/date")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BillResponse> billsByDate(
            @RequestParam String date,          // yyyy-MM-dd
            @RequestParam(required = false) Long outletId
    ) {
        return billService.billsByDate(LocalDate.parse(date), outletId);
    }

    // ✅ Bills by carNo (ADMIN + CASHIER)
    @GetMapping("/car")
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    public List<BillResponse> billsByCar(@RequestParam String carNo) {
        return billService.billsByCarNo(carNo);
    }

    // ✅ deleted bills (ADMIN only)
    @GetMapping("/deleted")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BillResponse> deletedBills() {
        return billService.deletedBills();
    }


    // /api/bills/total/monthly?year=2026&month=1
    // /api/bills/total/monthly?year=2026&month=1&outletId=1
    @GetMapping("/total/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public TotalBillResponse monthlyTotal(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long outletId
    ) {
        return billService.monthlyTotal(year, month, outletId);
    }

    // /api/bills/total/yearly?year=2026
    // /api/bills/total/yearly?year=2026&outletId=1
    @GetMapping("/total/yearly")
    @PreAuthorize("hasRole('ADMIN')")
    public TotalBillResponse yearlyTotal(
            @RequestParam int year,
            @RequestParam(required = false) Long outletId
    ) {
        return billService.yearlyTotal(year, outletId);
    }

    // /api/bills/yearly?year=2026
// /api/bills/yearly?year=2026&outletId=1
    @GetMapping("/yearly")
    @PreAuthorize("hasRole('ADMIN')")
    public List<BillYearResponse> getBillsByYear(
            @RequestParam int year,
            @RequestParam(required = false) Long outletId
    ) {
        return billService.getBillsByYear(year, outletId);
    }


}
