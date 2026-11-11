package com.carlight.demo.service.impl;

import com.carlight.demo.dto.billing.BillCreateRequest;
import com.carlight.demo.dto.billing.BillResponse;
import com.carlight.demo.dto.billing.BillYearResponse;
import com.carlight.demo.dto.billing.TotalBillResponse;
import com.carlight.demo.entity.*;
import com.carlight.demo.repository.*;
import com.carlight.demo.service.BillService;
import com.carlight.demo.util.InvoiceUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {

    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final OutletRepository outletRepository;
    private final CustomerRepository customerRepository;
    private final CarRepository carRepository;
    private final OutletPackageRepository outletPackageRepository;
    private final ExtraRepository extraRepository;
    private final CouponRepository couponRepository;
    private final CarCouponRepository carCouponRepository;



    @Override
    public List<BillResponse> getAllBills() {
        return billRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<BillResponse> getAllBillsByStaffID(Long staffId) {
        return billRepository.findByCreatedByIdAndDeletedFalseOrderByCreatedAtDesc(staffId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }


    @Override
    public BillResponse getBillById(Long billId) {
        Bill bill = billRepository.findByIdAndDeletedFalse(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));
        return mapToResponse(bill);
    }

    @Override
    public List<BillResponse> getBillsByOutlet(Long outletId) {
        return billRepository.findByOutletIdAndDeletedFalseOrderByCreatedAtDesc(outletId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<BillResponse> billsByDate(LocalDate date, Long outletId) {

        var start = date.atStartOfDay();
        var end = date.plusDays(1).atStartOfDay().minusSeconds(1);

        List<Bill> bills;

        if (outletId == null) {
            bills = billRepository.findByDeletedFalseAndCreatedAtBetweenOrderByCreatedAtDesc(start, end);
        } else {
            bills = billRepository.findByOutletIdAndDeletedFalseAndCreatedAtBetweenOrderByCreatedAtDesc(outletId, start, end);
        }

        return bills.stream().map(this::mapToResponse).toList();
    }

    @Override
    public List<BillResponse> billsByCarNo(String carNo) {
        String normalized = carNo.trim().toUpperCase();
        return billRepository.findByCarCarNoAndDeletedFalseOrderByCreatedAtDesc(normalized)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<BillResponse> deletedBills() {
        return billRepository.findByDeletedTrueOrderByDeletedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public BillResponse createBill(BillCreateRequest request, String userPhone) {

        // ✅ createdBy from JWT
        User staff = userRepository.findByPhoneNumber(userPhone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ outlet
        Outlet outlet = outletRepository.findById(request.getOutletId())
                .orElseThrow(() -> new RuntimeException("Outlet not found"));

        // ✅ customer
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // ✅ car
        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new RuntimeException("Car not found"));

        // ✅ validate ownership
        if (!car.getOwner().getId().equals(customer.getId())) {
            throw new RuntimeException("This car does not belong to this customer");
        }

        // ✅ outlet package pricing row (optional — null for fast/manual-amount billing)
        OutletPackage outletPackage = null;
        double packagePrice = 0.0;
        if (request.getOutletPackageId() != null) {
            outletPackage = outletPackageRepository.findById(request.getOutletPackageId())
                    .orElseThrow(() -> new RuntimeException("Outlet package not found"));

            // ✅ validate outlet package belongs to outlet
            if (!outletPackage.getOutlet().getId().equals(outlet.getId())) {
                throw new RuntimeException("Outlet package does not belong to outlet");
            }

            if (!Boolean.TRUE.equals(outletPackage.getActive())) {
                throw new RuntimeException("Outlet package inactive");
            }

            packagePrice = outletPackage.getPrice();
        } else {
            // ✅ Fast billing: auto-lookup the manual/free package (price ₹0)
            // If not found, proceed with null package — manualAmount drives the total
            var manualPkg = outletPackageRepository.findByOutlet_IdAndWashPackage_NameAndCarType(
                    outlet.getId(),
                    "MANUAL / FAST BILLING",
                    car.getCarType()
            );
            if (manualPkg.isPresent()) {
                outletPackage = manualPkg.get();
                if (!Boolean.TRUE.equals(outletPackage.getActive())) {
                    throw new RuntimeException("Outlet package inactive");
                }
                packagePrice = outletPackage.getPrice(); // 0.0
            }
            // else: outletPackage stays null, packagePrice stays 0.0 — manualAmount is the total
        }

        // ✅ extras
        List<Extra> extras = new ArrayList<>();
        if (request.getExtraIds() != null && !request.getExtraIds().isEmpty()) {
            extras = extraRepository.findAllById(request.getExtraIds());
        }

        double extrasTotal = extras.stream().mapToDouble(Extra::getPrice).sum();

        // ✅ additional charges
        Set<BillAdditionalCharge> charges = new HashSet<>();
        double chargesTotal = 0.0;

        if (request.getAdditionalCharges() != null) {
            for (var ch : request.getAdditionalCharges()) {

                if (ch.getTitle() == null || ch.getTitle().trim().isEmpty()) continue;
                if (ch.getAmount() == null || ch.getAmount() <= 0) continue;

                charges.add(BillAdditionalCharge.builder()
                        .title(ch.getTitle().trim())
                        .amount(ch.getAmount())
                        .build());

                chargesTotal += ch.getAmount();
            }
        }

        // ✅ total before discount
        // When manualAmount is provided (fast billing), it is the base total regardless of package.
        // Otherwise fall back to the package price (normal package billing).
        double baseAmount = (request.getManualAmount() != null)
                ? request.getManualAmount()
                : packagePrice;
        double totalBeforeDiscount = baseAmount + extrasTotal + chargesTotal;

        // ✅ manual discount
        double manualDiscount = request.getDiscount() != null ? request.getDiscount() : 0.0;
        if (manualDiscount < 0) manualDiscount = 0.0;

        // ✅ coupon handling (NEW: couponId based)
        Coupon appliedCoupon = null;
        double couponDiscount = 0.0;

        if (request.getCouponId() != null) {

            appliedCoupon = couponRepository.findById(request.getCouponId())
                    .orElseThrow(() -> new RuntimeException("Invalid couponId: " + request.getCouponId()));

            // ✅ validate coupon active + valid date
            if (!Boolean.TRUE.equals(appliedCoupon.getActive())) {
                throw new RuntimeException("Coupon inactive");
            }

            if (appliedCoupon.getValidTill() == null || appliedCoupon.getValidTill().isBefore(LocalDate.now())) {
                throw new RuntimeException("Coupon expired");
            }

            // ✅ max uses validation
            if (appliedCoupon.getMaxUses() != null && appliedCoupon.getUsedCount() >= appliedCoupon.getMaxUses()) {
                throw new RuntimeException("Coupon usage limit reached");
            }

            // ✅ outlet restriction
            if (appliedCoupon.getOutlet() != null) {
                if (!appliedCoupon.getOutlet().getId().equals(outlet.getId())) {
                    throw new RuntimeException("Coupon not applicable for this outlet");
                }
            }

            // ✅ car restriction
            if (appliedCoupon.getCar() != null) {
                if (!appliedCoupon.getCar().getId().equals(car.getId())) {
                    throw new RuntimeException("Coupon not applicable for this car");
                }
            }

            // ✅ once-per-car restriction
            if (Boolean.TRUE.equals(appliedCoupon.getOncePerCar())) {
                boolean alreadyUsed = carCouponRepository.existsByCoupon_IdAndCar_Id(
                        appliedCoupon.getId(),
                        car.getId()
                );

                if (alreadyUsed) {
                    throw new RuntimeException("Coupon already used for this car");
                }
            }

            // ✅ calculate coupon discount
            couponDiscount = calculateCouponDiscount(appliedCoupon, totalBeforeDiscount);

            // ✅ increase coupon global usage count
            appliedCoupon.setUsedCount(appliedCoupon.getUsedCount() + 1);
            couponRepository.save(appliedCoupon);
        }

        // ✅ final total
        double totalAmount = totalBeforeDiscount - manualDiscount - couponDiscount;
        if (totalAmount < 0) totalAmount = 0;

        // ✅ bill creation
        Bill bill = Bill.builder()
                .invoiceNo(InvoiceUtil.generateInvoiceNo(outlet.getId()))
                .outlet(outlet)
                .car(car)
                .outletPackage(outletPackage)
                .packagePriceSnapshot(packagePrice)
                .discount(manualDiscount)
                .totalAmount(totalAmount)
                .paymentMethod(request.getPaymentMethod())
                .createdBy(staff)
                .deleted(false)

                // ✅ coupon snapshot
                .coupon(appliedCoupon)
                .couponCodeSnapshot(appliedCoupon != null ? appliedCoupon.getCode() : null)
                .couponDiscountSnapshot(couponDiscount)
                .build();

        // ✅ bill extras snapshot
        Set<BillExtra> billExtras = new HashSet<>();
        for (Extra e : extras) {
            billExtras.add(BillExtra.builder()
                    .bill(bill)
                    .extra(e)
                    .extraNameSnapshot(e.getName())
                    .extraPriceSnapshot(e.getPrice())
                    .build());
        }
        bill.setBillExtras(billExtras);

        // ✅ link charges to bill
        for (BillAdditionalCharge c : charges) {
            c.setBill(bill);
        }
        bill.setAdditionalCharges(charges);

        Bill saved = billRepository.save(bill);

        // ✅ save usage mapping for once-per-car coupon
        if (appliedCoupon != null
                && Boolean.TRUE.equals(appliedCoupon.getOncePerCar())
                && couponDiscount > 0) {

            carCouponRepository.save(
                    CarCoupon.builder()
                            .coupon(appliedCoupon)
                            .car(car)
                            .bill(saved)
                            .build()
            );
        }

        return mapToResponse(saved);
    }


    // ✅ Mapper
    private BillResponse mapToResponse(Bill bill) {

        List<BillResponse.ExtraItem> extras = bill.getBillExtras() == null
                ? List.of()
                : bill.getBillExtras().stream()
                .map(x -> BillResponse.ExtraItem.builder()
                        .extraId(x.getExtra().getId())
                        .name(x.getExtraNameSnapshot())
                        .price(x.getExtraPriceSnapshot())
                        .build())
                .toList();

        List<BillResponse.AdditionalChargeItem> charges = bill.getAdditionalCharges() == null
                ? List.of()
                : bill.getAdditionalCharges().stream()
                .map(c -> BillResponse.AdditionalChargeItem.builder()
                        .title(c.getTitle())
                        .amount(c.getAmount())
                        .build())
                .toList();

        return BillResponse.builder()
                .billId(bill.getId())
                .invoiceNo(bill.getInvoiceNo())

                .customerName(bill.getCar().getOwner().getName())
                .phoneNumber(bill.getCar().getOwner().getPhoneNumber())

                .carNo(bill.getCar().getCarNo())
                .carType(String.valueOf(bill.getCar().getCarType()))
                .outletId(bill.getOutlet().getId())
                .outletName(bill.getOutlet().getName())

                .packageName(bill.getOutletPackage() != null && bill.getOutletPackage().getWashPackage() != null
                        ? bill.getOutletPackage().getWashPackage().getName()
                        : "Manual Billing")
                .packagePrice(bill.getPackagePriceSnapshot())

                .extras(extras)
                .additionalCharges(charges)

                .discount(bill.getDiscount())

                .couponCode(bill.getCouponCodeSnapshot())
                .couponDiscount(bill.getCouponDiscountSnapshot())

                .totalAmount(bill.getTotalAmount())
                .paymentMethod(bill.getPaymentMethod())

                .createdBy(
                        bill.getCreatedBy() != null
                                ? bill.getCreatedBy().getName() + " (" + bill.getCreatedBy().getPhoneNumber() + ")"
                                : null
                )
                .createdAt(bill.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void permanentDeleteBill(Long billId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));

        // optional safety: allow delete only if already soft-deleted
        // if (!Boolean.TRUE.equals(bill.getDeleted())) {
        //     throw new RuntimeException("First delete bill (soft delete), then permanent delete");
        // }

        billRepository.delete(bill);   // ✅ permanent delete
    }



    @Override
    public TotalBillResponse monthlyTotal(int year, int month, Long outletId) {
        Double total = billRepository.monthlyTotalBill(year, month, outletId);
        return new TotalBillResponse(total);
    }
    @Override
    public TotalBillResponse yearlyTotal(int year, Long outletId) {
        Double total = billRepository.yearlyTotalBill(year, outletId);
        return new TotalBillResponse(total);
    }

    @Override
    public List<BillYearResponse> getBillsByYear(int year, Long outletId) {

        return billRepository.findBillsByYear(year, outletId)
                .stream()
                .map(b -> BillYearResponse.builder()
                        .id(b.getId())
                        .totalAmount(b.getTotalAmount())
                        .discount(b.getDiscount())
                        .createdAt(b.getCreatedAt())

                        .outletId(b.getOutlet() != null ? b.getOutlet().getId() : null)
                        .outletName(b.getOutlet() != null ? b.getOutlet().getName() : null)

                        .carId(b.getCar() != null ? b.getCar().getId() : null)
                        .carNo(b.getCar() != null ? b.getCar().getCarNo() : null)
                        .carType(b.getCar() != null && b.getCar().getCarType() != null
                                ? b.getCar().getCarType().name() : null)

                        // ✅ analytics fields
                        .customerName(b.getCar() != null && b.getCar().getOwner() != null
                                ? b.getCar().getOwner().getName() : null)
                        .phoneNumber(b.getCar() != null && b.getCar().getOwner() != null
                                ? b.getCar().getOwner().getPhoneNumber() : null)
                        .packageName(b.getOutletPackage() != null && b.getOutletPackage().getWashPackage() != null
                                ? b.getOutletPackage().getWashPackage().getName() : null)
                        .paymentMethod(b.getPaymentMethod())
                        .couponCode(b.getCouponCodeSnapshot())
                        .build())
                .toList();
    }


    //////////////////////helper function ////////////////////////////
    private double calculateCouponDiscount(Coupon coupon, double totalBeforeDiscount) {

        if (coupon == null) return 0.0;

        if (coupon.getDiscountType() == DiscountType.FLAT) {
            return Math.min(coupon.getDiscountValue(), totalBeforeDiscount);
        }

        // PERCENT
        double percentDiscount = (totalBeforeDiscount * coupon.getDiscountValue()) / 100.0;
        return Math.min(percentDiscount, totalBeforeDiscount);
    }

}
