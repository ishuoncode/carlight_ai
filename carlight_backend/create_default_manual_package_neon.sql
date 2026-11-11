-- ============================================================================
-- Create a default "MANUAL / FAST BILLING" wash package (price ₹0)
-- for each outlet on Neon PostgreSQL (production).
-- Run this ONCE against your Neon production database.
-- ============================================================================

-- 1) Create the manual wash package (if not already present)
INSERT INTO wash_packages (created_at, name, description, active)
SELECT now(), 'MANUAL / FAST BILLING', 'Default package for fast/manual-amount billing — price ₹0', true
WHERE NOT EXISTS (
    SELECT 1 FROM wash_packages wp WHERE wp.name = 'MANUAL / FAST BILLING'
);

-- 2) Create outlet_packages entries (price 0) for each outlet + car type
INSERT INTO outlet_packages (created_at, active, car_type, price, outlet_id, wash_package_id)
SELECT now(), true, t.car_type, 0.0, t.outlet_id, wp.id
FROM (
    VALUES
    (1,'BIKE'),(1,'SMALL_CAR'),(1,'MEDIUM_CAR'),(1,'LARGE_CAR'),
    (1,'PICKUP'),(1,'TRACTOR'),(1,'JCB'),(1,'OTHER'),
    (2,'BIKE'),(2,'SMALL_CAR'),(2,'MEDIUM_CAR'),(2,'LARGE_CAR'),
    (2,'PICKUP'),(2,'TRACTOR'),(2,'JCB'),(2,'OTHER')
) AS t(outlet_id, car_type)
CROSS JOIN wash_packages wp
WHERE wp.name = 'MANUAL / FAST BILLING'
  AND NOT EXISTS (
    SELECT 1 FROM outlet_packages op
    WHERE op.outlet_id = t.outlet_id
      AND op.wash_package_id = wp.id
      AND op.car_type = t.car_type
  );

-- 3) Show the created package IDs (use these in frontend fastBillingPackageId if needed)
SELECT op.id AS outlet_package_id, op.outlet_id, op.car_type, op.price, wp.name AS package_name
FROM outlet_packages op
JOIN wash_packages wp ON wp.id = op.wash_package_id
WHERE wp.name = 'MANUAL / FAST BILLING'
ORDER BY op.outlet_id, op.car_type;
