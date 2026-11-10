-- ============================================================================
-- Create a default "MANUAL / FAST BILLING" wash package (price ₹0)
-- for each outlet. This satisfies the NOT NULL constraint on bills.outlet_package_id
-- while keeping fast billing free of any package price.
-- Run this ONCE against your local MySQL database.
-- ============================================================================

-- 1) Create the manual wash package (if not already present)
INSERT INTO wash_packages (created_at, name, description, active)
SELECT NOW(), 'MANUAL / FAST BILLING', 'Default package for fast/manual-amount billing — price ₹0', 1
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM wash_packages wp WHERE wp.name = 'MANUAL / FAST BILLING'
);

-- 2) Create outlet_packages entries (price 0) for each outlet + car type
INSERT INTO outlet_packages (created_at, active, car_type, price, outlet_id, wash_package_id)
SELECT NOW(), 1, t.car_type, 0.0, t.outlet_id, wp.id
FROM (
    SELECT 1 AS outlet_id, 'BIKE' AS car_type
    UNION ALL SELECT 1, 'SMALL_CAR'
    UNION ALL SELECT 1, 'MEDIUM_CAR'
    UNION ALL SELECT 1, 'LARGE_CAR'
    UNION ALL SELECT 1, 'PICKUP'
    UNION ALL SELECT 1, 'TRACTOR'
    UNION ALL SELECT 1, 'JCB'
    UNION ALL SELECT 1, 'OTHER'
    UNION ALL SELECT 2, 'BIKE'
    UNION ALL SELECT 2, 'SMALL_CAR'
    UNION ALL SELECT 2, 'MEDIUM_CAR'
    UNION ALL SELECT 2, 'LARGE_CAR'
    UNION ALL SELECT 2, 'PICKUP'
    UNION ALL SELECT 2, 'TRACTOR'
    UNION ALL SELECT 2, 'JCB'
    UNION ALL SELECT 2, 'OTHER'
) AS t
CROSS JOIN wash_packages wp
WHERE wp.name = 'MANUAL / FAST BILLING'
  AND NOT EXISTS (
    SELECT 1 FROM outlet_packages op
    WHERE op.outlet_id = t.outlet_id
      AND op.wash_package_id = wp.id
      AND op.car_type = t.car_type
  );

-- 3) Show the created package IDs (use these in frontend fastBillingPackageId)
SELECT op.id AS outlet_package_id, op.outlet_id, op.car_type, op.price, wp.name AS package_name
FROM outlet_packages op
JOIN wash_packages wp ON wp.id = op.wash_package_id
WHERE wp.name = 'MANUAL / FAST BILLING'
ORDER BY op.outlet_id, op.car_type;
