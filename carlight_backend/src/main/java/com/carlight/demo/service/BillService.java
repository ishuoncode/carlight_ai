package com.carlight.demo.service;

import com.carlight.demo.dto.billing.BillCreateRequest;
import com.carlight.demo.dto.billing.BillResponse;
import com.carlight.demo.dto.billing.BillYearResponse;
import com.carlight.demo.dto.billing.TotalBillResponse;


import java.time.LocalDate;
import java.util.List;

public interface BillService {

    // ✅ Fetch all bills (admin)
    List<BillResponse> getAllBills();

    List<BillResponse> getAllBillsByStaffID(Long staffId);

    // ✅ Fetch bill by id
    BillResponse getBillById(Long billId);

    // ✅ Fetch bills by outlet
    List<BillResponse> getBillsByOutlet(Long outletId);

    // ✅ Bills by date (all or particular outlet)
    List<BillResponse> billsByDate(LocalDate date, Long outletId);

    // ✅ Bills by car number
    List<BillResponse> billsByCarNo(String carNo);

    // ✅ Deleted bills list
    List<BillResponse> deletedBills();

    void permanentDeleteBill(Long billId);


    BillResponse createBill(BillCreateRequest request, String userPhone);

    TotalBillResponse monthlyTotal(int year, int month, Long outletId);
    TotalBillResponse yearlyTotal(int year, Long outletId);



    List<BillYearResponse> getBillsByYear(int year, Long outletId);




}
