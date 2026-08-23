package com.carlight.demo.service.impl;

import com.carlight.demo.dto.coupon.BestCouponRequest;
import com.carlight.demo.dto.coupon.BestCouponResponse;
import com.carlight.demo.dto.coupon.CouponCreateRequest;
import com.carlight.demo.dto.coupon.CouponResponse;
import com.carlight.demo.entity.*;
import com.carlight.demo.exception.BadRequestException;
import com.carlight.demo.repository.*;
import com.carlight.demo.service.CouponService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final OutletRepository outletRepository;
    private final CarRepository carRepository;
    private final CarCouponRepository carCouponRepository;
    private final OutletPackageRepository outletPackageRepository;
    private final ExtraRepository extraRepository;

    @Override
    @Transactional
    public CouponResponse create(CouponCreateRequest request) {

        String code = request.getCode().trim().toUpperCase();

        if (couponRepository.existsByCodeIgnoreCase(code)) {
            throw new BadRequestException("Coupon code already exists: " + code);
        }

        Outlet outlet = null;
        if (request.getOutletId() != null) {
            outlet = outletRepository.findById(request.getOutletId())
                    .orElseThrow(() -> new BadRequestException("Outlet not found: " + request.getOutletId()));
        }

        Car car = null;
        if (request.getCarId() != null) {
            car = carRepository.findById(request.getCarId())
                    .orElseThrow(() -> new BadRequestException("Car not found: " + request.getCarId()));
        }

        Coupon coupon = Coupon.builder()
                .code(code)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .validTill(request.getValidTill())
                .outlet(outlet)
                .car(car)
                .active(true)
                .maxUses(request.getMaxUses() != null ? request.getMaxUses() : 999999)
                .usedCount(0)
                .oncePerCar(request.getOncePerCar() != null && request.getOncePerCar())
                .build();

        Coupon saved = couponRepository.save(coupon);

        return toResponse(saved);
    }

    @Override
    public List<CouponResponse> getAll() {
        return couponRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CouponResponse getById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Coupon not found: " + id));
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse updateStatus(Long id, boolean active) {

        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Coupon not found: " + id));

        coupon.setActive(active);
        Coupon saved = couponRepository.save(coupon);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse renew(Long id, LocalDate validTill, boolean resetUsage, Integer maxUses) {

        if (validTill == null) {
            throw new BadRequestException("New expiry date is required");
        }
        if (validTill.isBefore(LocalDate.now())) {
            throw new BadRequestException("New expiry date must be today or later");
        }

        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Coupon not found: " + id));

        coupon.setValidTill(validTill);
        coupon.setActive(true);            // renewal always re-activates

        if (resetUsage) {
            coupon.setUsedCount(0);        // optional: give the coupon a fresh usage budget
        }

        if (maxUses != null) {
            applyMaxUses(coupon, maxUses); // optional: change the limit while renewing
        }

        Coupon saved = couponRepository.save(coupon);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateUsage(Long id, Integer maxUses, Integer usedCount) {

        if (maxUses == null && usedCount == null) {
            throw new BadRequestException("Nothing to update — provide maxUses and/or usedCount");
        }

        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Coupon not found: " + id));

        if (maxUses != null) {
            applyMaxUses(coupon, maxUses);
        }

        if (usedCount != null) {
            if (usedCount < 0) {
                throw new BadRequestException("Used count cannot be negative");
            }
            int limit = coupon.getMaxUses() != null ? coupon.getMaxUses() : 0;
            if (usedCount > limit) {
                throw new BadRequestException("Used count (" + usedCount + ") cannot exceed max uses (" + limit + ")");
            }
            coupon.setUsedCount(usedCount);
        }

        Coupon saved = couponRepository.save(coupon);
        return toResponse(saved);
    }

    // helper: shared max-uses validation
    private void applyMaxUses(Coupon coupon, int maxUses) {
        if (maxUses < 1) {
            throw new BadRequestException("Max uses must be at least 1");
        }
        if (coupon.getUsedCount() != null && coupon.getUsedCount() > maxUses) {
            throw new BadRequestException(
                    "Max uses (" + maxUses + ") cannot be less than the already used count (" + coupon.getUsedCount() + ")");
        }
        coupon.setMaxUses(maxUses);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!couponRepository.existsById(id)) {
            throw new BadRequestException("Coupon not found: " + id);
        }
        couponRepository.deleteById(id);
    }

    @Override
    public BestCouponResponse bestCoupon(BestCouponRequest request) {

        String code = request.getCode().trim().toUpperCase();

        List<Coupon> list = couponRepository.findBestCouponForBill(
                code,
                request.getOutletId(),
                request.getCarId(),
                LocalDate.now()
        );

        if (list.isEmpty()) {
            return BestCouponResponse.builder()
                    .valid(false)
                    .message("Coupon not applicable")
                    .build();
        }

        Coupon best = list.get(0);



        return BestCouponResponse.builder()
                .valid(true)
                .couponId(best.getId())
                .code(best.getCode())
                .discountType(best.getDiscountType())
                .discountValue(best.getDiscountValue())
                .oncePerCar(best.getOncePerCar())
                .message("Coupon applicable")
                .build();
    }


    @Override
    public List<CouponResponse> eligibleCoupons(Long outletId, Long carId) {

        List<Coupon> coupons = couponRepository.findEligibleCouponsForBill(
                outletId,
                carId,
                LocalDate.now()
        );

        return coupons.stream().map(this::toResponse).toList();
    }

    @Override
    public BestCouponResponse previewBestCoupon(BestCouponRequest request) {

        String code = request.getCode().trim().toUpperCase();

        // ✅ 1) Load pricing row (OutletPackage)
        OutletPackage outletPackage = outletPackageRepository.findById(request.getOutletPackageId())
                .orElseThrow(() -> new BadRequestException("Outlet package not found: " + request.getOutletPackageId()));

        // ✅ Validate outlet matches
        if (!outletPackage.getOutlet().getId().equals(request.getOutletId())) {
            throw new BadRequestException("Outlet package does not belong to outlet: " + request.getOutletId());
        }

        if (!Boolean.TRUE.equals(outletPackage.getActive())) {
            throw new BadRequestException("Outlet package inactive");
        }

        // ✅ 2) Calculate totalBeforeDiscount
        double packagePrice = outletPackage.getPrice();

        List<Extra> extras = List.of();
        if (request.getExtraIds() != null && !request.getExtraIds().isEmpty()) {
            extras = extraRepository.findAllById(request.getExtraIds());
        }
        double extrasTotal = extras.stream().mapToDouble(Extra::getPrice).sum();

        double chargesTotal = 0.0;
        if (request.getAdditionalCharges() != null) {
            chargesTotal = request.getAdditionalCharges().stream()
                    .filter(c -> c.getTitle() != null && !c.getTitle().trim().isEmpty())
                    .filter(c -> c.getAmount() != null && c.getAmount() > 0)
                    .mapToDouble(BestCouponRequest.AdditionalChargeRequest::getAmount)
                    .sum();
        }

        double totalBeforeDiscount = packagePrice + extrasTotal + chargesTotal;

        // ✅ manual discount
        double manualDiscount = request.getManualDiscount() != null ? request.getManualDiscount() : 0.0;
        if (manualDiscount < 0) manualDiscount = 0;
        if (manualDiscount > totalBeforeDiscount) manualDiscount = totalBeforeDiscount;

        // ✅ 3) Find eligible coupons (best first)
        List<Coupon> coupons = couponRepository.findBestCouponForBill(
                code,
                request.getOutletId(),
                request.getCarId(),
                LocalDate.now()
        );

        if (coupons.isEmpty()) {
            return BestCouponResponse.builder()
                    .valid(false)
                    .message("Invalid/Expired coupon: " + code)
                    .code(code)
                    .totalBeforeDiscount(totalBeforeDiscount)
                    .manualDiscount(manualDiscount)
                    .couponDiscount(0.0)
                    .finalPayable(totalBeforeDiscount - manualDiscount)
                    .build();
        }

        // ✅ 4) Filter oncePerCar coupons that are already used
        Coupon applied = null;

        for (Coupon c : coupons) {
            if (Boolean.TRUE.equals(c.getOncePerCar())) {
                boolean alreadyUsed = carCouponRepository.existsByCoupon_IdAndCar_Id(c.getId(), request.getCarId());
                if (alreadyUsed) continue;
            }
            applied = c;
            break;
        }

        if (applied == null) {
            return BestCouponResponse.builder()
                    .valid(false)
                    .message("Coupon already used for this car: " + code)
                    .code(code)
                    .totalBeforeDiscount(totalBeforeDiscount)
                    .manualDiscount(manualDiscount)
                    .couponDiscount(0.0)
                    .finalPayable(totalBeforeDiscount - manualDiscount)
                    .build();
        }

        // ✅ 5) Calculate coupon discount
        double couponDiscount = calculateCouponDiscount(applied, totalBeforeDiscount);

        // ✅ final payable
        double finalPayable = totalBeforeDiscount - manualDiscount - couponDiscount;
        if (finalPayable < 0) finalPayable = 0;

        return BestCouponResponse.builder()
                .valid(true)
                .message("Coupon applied successfully")
                .couponId(applied.getId())
                .code(applied.getCode())
                .totalBeforeDiscount(totalBeforeDiscount)
                .manualDiscount(manualDiscount)
                .couponDiscount(couponDiscount)
                .finalPayable(finalPayable)
                .discountType(applied.getDiscountType())
                .discountValue(applied.getDiscountValue())
                .oncePerCar(applied.getOncePerCar())
                .build();
    }

    // ✅ helper
    private double calculateCouponDiscount(Coupon coupon, double totalBeforeDiscount) {
        if (coupon == null) return 0.0;

        if (coupon.getDiscountType() == DiscountType.FLAT) {
            return Math.min(coupon.getDiscountValue(), totalBeforeDiscount);
        }

        double percentDiscount = (totalBeforeDiscount * coupon.getDiscountValue()) / 100.0;
        return Math.min(percentDiscount, totalBeforeDiscount);
    }




    private CouponResponse toResponse(Coupon c) {

        return CouponResponse.builder()
                .id(c.getId())
                .code(c.getCode())
                .discountType(c.getDiscountType())
                .discountValue(c.getDiscountValue())
                .validTill(c.getValidTill())
                .active(c.getActive())
                .maxUses(c.getMaxUses())
                .usedCount(c.getUsedCount())
                .outletId(c.getOutlet() != null ? c.getOutlet().getId() : null)
                .outletName(c.getOutlet() != null ? c.getOutlet().getName() : null)
                .carId(c.getCar() != null ? c.getCar().getId() : null)
                .carNo(c.getCar() != null ? c.getCar().getCarNo() : null)
                .createdAt(c.getCreatedAt())
                .oncePerCar(c.getOncePerCar())
                .build();
    }
}
