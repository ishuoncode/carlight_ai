-- ============================================================
-- DUMMY TEST DATA FOR 2026 — CarLight (update_carwash_db)
-- Covers: customers, cars, bills (Jan-Aug 2026), expenses
-- Safe to run once. Uses admin user id=1 as creator.
-- ============================================================
USE update_carwash_db;

START TRANSACTION;

-- ---------- 0. Premium wash pricing (so all 3 packages appear in charts) ----------
INSERT INTO outlet_packages (created_at, active, car_type, price, outlet_id, wash_package_id)
SELECT NOW(), 1, t.car_type, t.price, t.outlet_id, 3
FROM (
  SELECT 1 AS outlet_id,'BIKE' car_type,150 price UNION ALL SELECT 1,'SMALL_CAR',300 UNION ALL SELECT 1,'MEDIUM_CAR',450
  UNION ALL SELECT 1,'LARGE_CAR',600 UNION ALL SELECT 1,'PICKUP',700 UNION ALL SELECT 1,'TRACTOR',800
  UNION ALL SELECT 1,'JCB',900 UNION ALL SELECT 1,'OTHER',150
  UNION ALL SELECT 2,'BIKE',180 UNION ALL SELECT 2,'SMALL_CAR',330 UNION ALL SELECT 2,'MEDIUM_CAR',480
  UNION ALL SELECT 2,'LARGE_CAR',650 UNION ALL SELECT 2,'PICKUP',750 UNION ALL SELECT 2,'TRACTOR',850
  UNION ALL SELECT 2,'JCB',950 UNION ALL SELECT 2,'OTHER',180
) t
WHERE NOT EXISTS (
  SELECT 1 FROM outlet_packages op
  WHERE op.outlet_id = t.outlet_id AND op.wash_package_id = 3 AND op.car_type = t.car_type
);

-- ---------- 1. Customers ----------
INSERT IGNORE INTO customers (created_at, name, phone_number, active) VALUES
(NOW(),'Ramesh Kumar','9810011221',1),
(NOW(),'Suresh Patel','9810011222',1),
(NOW(),'Anita Sharma','9810011223',1),
(NOW(),'Vikram Singh','9810011224',1),
(NOW(),'Priya Verma','9810011225',1),
(NOW(),'Rahul Gupta','9810011226',1),
(NOW(),'Deepak Joshi','9810011227',1),
(NOW(),'Meena Iyer','9810011228',1),
(NOW(),'Arjun Mehta','9810011229',1),
(NOW(),'Kavita Reddy','9810011230',1),
(NOW(),'Sanjay Yadav','9810011231',1),
(NOW(),'Pooja Nair','9810011232',1);

-- ---------- 2. Cars ----------
INSERT IGNORE INTO cars (created_at, car_no, car_type, model, customer_id, active, deleted) VALUES
(NOW(),'DL01AB2601','SMALL_CAR','Swift',        (SELECT id FROM customers WHERE phone_number='9810011221'),1,0),
(NOW(),'DL01AB2602','MEDIUM_CAR','Honda City', (SELECT id FROM customers WHERE phone_number='9810011222'),1,0),
(NOW(),'DL02CD2603','LARGE_CAR','Toyota Fortuner',(SELECT id FROM customers WHERE phone_number='9810011223'),1,0),
(NOW(),'UP03EF2604','SMALL_CAR','Hyundai i10', (SELECT id FROM customers WHERE phone_number='9810011224'),1,0),
(NOW(),'UP04GH2605','MEDIUM_CAR','Kia Seltos', (SELECT id FROM customers WHERE phone_number='9810011225'),1,0),
(NOW(),'HR05IJ2606','PICKUP','Mahindra Bolero',(SELECT id FROM customers WHERE phone_number='9810011226'),1,0),
(NOW(),'HR07KL2607','SMALL_CAR','Tata Punch',  (SELECT id FROM customers WHERE phone_number='9810011227'),1,0),
(NOW(),'BR08MN2608','LARGE_CAR','MG Hector',   (SELECT id FROM customers WHERE phone_number='9810011228'),1,0),
(NOW(),'MP09PQ2609','MEDIUM_CAR','Skoda Slavia',(SELECT id FROM customers WHERE phone_number='9810011229'),1,0),
(NOW(),'RJ10RS2610','BIKE','Bajaj Pulsar',     (SELECT id FROM customers WHERE phone_number='9810011230'),1,0),
(NOW(),'GJ11TU2611','BIKE','Honda Activa',     (SELECT id FROM customers WHERE phone_number='9810011231'),1,0),
(NOW(),'MH12VW2612','TRACTOR','John Deere 5310',(SELECT id FROM customers WHERE phone_number='9810011232'),1,0),
(NOW(),'DL13XY2613','JCB','JCB 3DX',           (SELECT id FROM customers WHERE phone_number='9810011221'),1,0),
(NOW(),'UP14ZA2614','SMALL_CAR','Maruti WagonR',(SELECT id FROM customers WHERE phone_number='9810011222'),1,0),
(NOW(),'HR15BC2615','OTHER','Tempo Traveller', (SELECT id FROM customers WHERE phone_number='9810011223'),1,0),
(NOW(),'RJ16DE2616','MEDIUM_CAR','Volkswagen Virtus',(SELECT id FROM customers WHERE phone_number='9810011224'),1,0);

-- ---------- 3. Bills: Jan 1 – Aug 20, 2026 (~350 random services) ----------
INSERT INTO bills
  (created_at, invoice_no, outlet_id, car_id, outlet_package_id,
   package_price_snapshot, discount, total_amount, payment_method,
   created_by_user_id, deleted)
SELECT
  d_time,
  CONCAT('CW-', outlet_id, '-', UPPER(DATE_FORMAT(d,'%b')), '-', UPPER(CONCAT(SUBSTRING(MD5(rnd),1,10)))) AS invoice_no,
  outlet_id, car_id, op_id, price, disc, price - disc, pm,
  1, 0
FROM (
  SELECT
    s.d, s.d_time,
    c.id AS car_id,
    op.id AS op_id,
    op.outlet_id,
    op.price,
    CASE WHEN RAND() < 0.15 THEN ROUND(op.price * 0.10) ELSE 0 END AS disc,
    ELT(1 + FLOOR(RAND() * 3), 'CASH', 'UPI', 'CARD') AS pm,
    RAND() AS rnd
  FROM (
    WITH RECURSIVE dates AS (
      SELECT DATE '2026-01-01' AS d
      UNION ALL
      SELECT d + INTERVAL 1 DAY FROM dates WHERE d < '2026-08-20'
    )
    SELECT d,
           TIMESTAMP(d, SEC_TO_TIME(28800 + FLOOR(RAND() * 39600))) AS d_time  -- random hour 08:00–18:59
    FROM dates
  ) s
  JOIN cars c ON c.deleted = 0 AND c.active = 1
  JOIN outlet_packages op ON op.car_type = c.car_type AND op.active = 1
  WHERE RAND() < 0.18
) x;

-- ---------- 4. Expenses: Jan–Aug 2026 for both outlets ----------
INSERT INTO expenses (created_at, amount, category, notes, title, added_by_user_id, outlet_id)
SELECT
  TIMESTAMP(m.m, '10:00:00'),
  e.amt,
  e.cat,
  NULL,
  CONCAT(e.label, ' - ', MONTHNAME(m.m), ' 2026'),
  1,
  o.id
FROM (
  WITH RECURSIVE months AS (
    SELECT DATE '2026-01-01' AS m
    UNION ALL
    SELECT m + INTERVAL 1 MONTH FROM months WHERE m < '2026-08-01'
  )
  SELECT m FROM months
) m
CROSS JOIN (SELECT id FROM outlets) o
CROSS JOIN (
  SELECT 'RENT' cat, 'Rent' label, 15000.0 amt UNION ALL
  SELECT 'SALARY', 'Staff Salaries', 26000.0 UNION ALL
  SELECT 'WATER', 'Water Supply', ROUND(700 + RAND() * 500, 2) UNION ALL
  SELECT 'ELECTRICITY', 'Electricity Bill', ROUND(2500 + RAND() * 1800, 2) UNION ALL
  SELECT 'CHEMICALS', 'Shampoo & Wax Supplies', ROUND(1200 + RAND() * 900, 2) UNION ALL
  SELECT 'INTERNET', 'Broadband', 999.0 UNION ALL
  SELECT 'MAINTENANCE', 'Equipment Maintenance', ROUND(800 + RAND() * 2200, 2)
) e;

COMMIT;

-- ---------- Summary ----------
SELECT 'customers' t, COUNT(*) n FROM customers
UNION ALL SELECT 'cars', COUNT(*) FROM cars
UNION ALL SELECT 'bills_2026', COUNT(*) FROM bills WHERE YEAR(created_at)=2026
UNION ALL SELECT 'expenses_2026', COUNT(*) FROM expenses WHERE YEAR(created_at)=2026
UNION ALL SELECT 'bills_revenue_2026', SUM(total_amount) FROM bills WHERE YEAR(created_at)=2026
UNION ALL SELECT 'expenses_total_2026', SUM(amount) FROM expenses WHERE YEAR(created_at)=2026;