-- ============================================================
-- CarLight FINAL SEED (PostgreSQL / Neon-safe, autocommit per statement)
-- Idempotent — safe to run multiple times.
-- ============================================================

INSERT INTO outlets (id, created_at, name, address, active) VALUES
 (1, now(), 'CarLight Main — Rath Purab', 'Charkhari Rd, Rath Purab, UP 210431', true),
 (2, now(), 'CarLight Branch 2', 'Main Market Road, UP', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO wash_packages (id, created_at, name, description, active) VALUES
 (1, now(), 'BASIC',   'Exterior body wash',                   true),
 (2, now(), 'DELUXE',  'Exterior + interior cleaning',         true),
 (3, now(), 'PREMIUM', 'Full service — wax, polish, interior', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, created_at, name, phone_number, password, role, active) VALUES
 (1, now(), 'Super Admin', '9999999999',
  '$2a$10$0A6hLtPMT.qQ5BsicR3CFOpUBcff0w4.lAd7SsqQFtZvMW6skpm2S',
  'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('outlets','id'),       GREATEST((SELECT MAX(id) FROM outlets), 1));
SELECT setval(pg_get_serial_sequence('wash_packages','id'), GREATEST((SELECT MAX(id) FROM wash_packages), 1));
SELECT setval(pg_get_serial_sequence('users','id'),         GREATEST((SELECT MAX(id) FROM users), 1));

INSERT INTO outlet_packages (created_at, active, car_type, price, outlet_id, wash_package_id)
SELECT now(), true, t.car_type, t.price, t.outlet_id, 3
FROM (VALUES
  (1,'BIKE',150),(1,'SMALL_CAR',300),(1,'MEDIUM_CAR',450),(1,'LARGE_CAR',600),
  (1,'PICKUP',700),(1,'TRACTOR',800),(1,'JCB',900),(1,'OTHER',150),
  (2,'BIKE',180),(2,'SMALL_CAR',330),(2,'MEDIUM_CAR',480),(2,'LARGE_CAR',650),
  (2,'PICKUP',750),(2,'TRACTOR',850),(2,'JCB',950),(2,'OTHER',180)
) AS t(outlet_id, car_type, price)
WHERE NOT EXISTS (
  SELECT 1 FROM outlet_packages op
  WHERE op.outlet_id = t.outlet_id AND op.wash_package_id = 3 AND op.car_type = t.car_type
);

INSERT INTO customers (created_at, name, phone_number, active)
SELECT now(), t.name, t.phone, true
FROM (VALUES
  ('Ramesh Kumar','9810011221'),('Suresh Patel','9810011222'),
  ('Anita Sharma','9810011223'),('Vikram Singh','9810011224'),
  ('Priya Verma','9810011225'),('Rahul Gupta','9810011226'),
  ('Deepak Joshi','9810011227'),('Meena Iyer','9810011228'),
  ('Arjun Mehta','9810011229'),('Kavita Reddy','9810011230'),
  ('Sanjay Yadav','9810011231'),('Pooja Nair','9810011232')
) AS t(name, phone)
WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.phone_number = t.phone);

INSERT INTO cars (created_at, car_no, car_type, model, customer_id, active, deleted)
SELECT now(), t.car_no, t.car_type, t.model, c.id, true, false
FROM (VALUES
  ('DL01AB2601','SMALL_CAR','Swift',            '9810011221'),
  ('DL01AB2602','MEDIUM_CAR','Honda City',      '9810011222'),
  ('DL02CD2603','LARGE_CAR','Toyota Fortuner',  '9810011223'),
  ('UP03EF2604','SMALL_CAR','Hyundai i10',      '9810011224'),
  ('UP04GH2605','MEDIUM_CAR','Kia Seltos',      '9810011225'),
  ('HR05IJ2606','PICKUP','Mahindra Bolero',     '9810011226'),
  ('HR07KL2607','SMALL_CAR','Tata Punch',       '9810011227'),
  ('BR08MN2608','LARGE_CAR','MG Hector',        '9810011228'),
  ('MP09PQ2609','MEDIUM_CAR','Skoda Slavia',    '9810011229'),
  ('RJ10RS2610','BIKE','Bajaj Pulsar',          '9810011230'),
  ('GJ11TU2611','BIKE','Honda Activa',          '9810011231'),
  ('MH12VW2612','TRACTOR','John Deere 5310',    '9810011232'),
  ('DL13XY2613','JCB','JCB 3DX',                '9810011221'),
  ('UP14ZA2614','SMALL_CAR','Maruti WagonR',    '9810011222'),
  ('HR15BC2615','OTHER','Tempo Traveller',      '9810011223'),
  ('RJ16DE2616','MEDIUM_CAR','Volkswagen Virtus','9810011224')
) AS t(car_no, car_type, model, phone)
JOIN customers c ON c.phone_number = t.phone
WHERE NOT EXISTS (SELECT 1 FROM cars x WHERE x.car_no = t.car_no);

INSERT INTO outlet_packages (created_at, active, car_type, price, outlet_id, wash_package_id)
SELECT now(), true, t.car_type, t.price, t.outlet_id, t.wp_id
FROM (VALUES
  (1,'BASIC',1,'BIKE',80),(1,'BASIC',1,'SMALL_CAR',150),(1,'BASIC',1,'MEDIUM_CAR',200),
  (1,'BASIC',1,'LARGE_CAR',250),(1,'BASIC',1,'PICKUP',300),(1,'BASIC',1,'TRACTOR',350),
  (1,'BASIC',1,'JCB',400),(1,'BASIC',1,'OTHER',100),
  (2,'DELUXE',2,'BIKE',120),(2,'DELUXE',2,'SMALL_CAR',250),(2,'DELUXE',2,'MEDIUM_CAR',350),
  (2,'DELUXE',2,'LARGE_CAR',450),(2,'DELUXE',2,'PICKUP',500),(2,'DELUXE',2,'TRACTOR',600),
  (2,'DELUXE',2,'JCB',700),(2,'DELUXE',2,'OTHER',150)
) AS t(outlet_id, pkg_name, wp_id, car_type, price)
WHERE NOT EXISTS (
  SELECT 1 FROM outlet_packages op
  WHERE op.outlet_id = t.outlet_id AND op.wash_package_id = t.wp_id AND op.car_type = t.car_type
);

-- Bills: Jan 1 – Aug 20, 2026 (~1300 random services across all packages)
INSERT INTO bills
  (created_at, invoice_no, outlet_id, car_id, outlet_package_id,
   package_price_snapshot, discount, total_amount, payment_method,
   created_by_user_id, deleted)
SELECT
  d_time,
  'CW-' || outlet_id || '-' || UPPER(to_char(d,'Mon')) || '-'
          || UPPER(SUBSTRING(md5(rnd::text) FROM 1 FOR 10)),
  outlet_id, car_id, op_id, price, disc, price - disc, pm,
  1, false
FROM (
  SELECT
    s.d, s.d_time,
    c.id  AS car_id,
    op.id AS op_id,
    op.outlet_id,
    op.price,
    CASE WHEN RANDOM() < 0.15 THEN ROUND(op.price * 0.10) ELSE 0 END AS disc,
    (ARRAY['CASH','UPI','CARD'])[1 + FLOOR(RANDOM()*3)::int] AS pm,
    RANDOM() AS rnd
  FROM (
    WITH RECURSIVE dates AS (
      SELECT DATE '2026-01-01' AS d
      UNION ALL
      SELECT d + 1 FROM dates WHERE d < DATE '2026-08-20'
    )
    SELECT d,
           d::timestamp + make_interval(secs => 28800 + FLOOR(RANDOM()*39600)::int) AS d_time
    FROM dates
  ) s
  JOIN cars c ON c.deleted = false AND c.active = true
  JOIN outlet_packages op ON op.car_type = c.car_type AND op.active = true
  WHERE RANDOM() < 0.18
) x;

-- Expenses: Jan–Aug 2026 for both outlets
INSERT INTO expenses (created_at, amount, category, notes, title, added_by_user_id, outlet_id)
SELECT
  m.m + interval '10 hours',
  e.amt,
  e.cat,
  NULL,
  e.label || ' - ' || to_char(m.m,'FMMonth') || ' 2026',
  1,
  o.id
FROM generate_series(DATE '2026-01-01'::timestamp, DATE '2026-08-01'::timestamp, INTERVAL '1 month') AS m(m)
CROSS JOIN outlets o
CROSS JOIN (VALUES
  ('RENT',       'Rent',                   15000.0::double precision),
  ('SALARY',     'Staff Salaries',         26000.0::double precision),
  ('WATER',      'Water Supply',           ROUND((700  + RANDOM()*500)::numeric, 2)),
  ('ELECTRICITY','Electricity Bill',       ROUND((2500 + RANDOM()*1800)::numeric, 2)),
  ('CHEMICALS',  'Shampoo & Wax Supplies', ROUND((1200 + RANDOM()*900)::numeric, 2)),
  ('INTERNET',   'Broadband',              999.0::double precision),
  ('MAINTENANCE','Equipment Maintenance',  ROUND((800  + RANDOM()*2200)::numeric, 2))
) AS e(cat, label, amt);

-- keep sequences ahead
SELECT setval(pg_get_serial_sequence('customers','id'), GREATEST((SELECT MAX(id) FROM customers), 1));
SELECT setval(pg_get_serial_sequence('cars','id'),      GREATEST((SELECT MAX(id) FROM cars), 1));
SELECT setval(pg_get_serial_sequence('bills','id'),     GREATEST((SELECT MAX(id) FROM bills), 1));
SELECT setval(pg_get_serial_sequence('expenses','id'),  GREATEST((SELECT MAX(id) FROM expenses), 1));
SELECT setval(pg_get_serial_sequence('outlet_packages','id'), GREATEST((SELECT MAX(id) FROM outlet_packages), 1));

-- final counts
SELECT 'outlets' t, COUNT(*) n FROM outlets
UNION ALL SELECT 'wash_packages', COUNT(*) FROM wash_packages
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'cars', COUNT(*) FROM cars
UNION ALL SELECT 'outlet_packages', COUNT(*) FROM outlet_packages
UNION ALL SELECT 'bills_2026', COUNT(*) FROM bills WHERE EXTRACT(year FROM created_at) = 2026
UNION ALL SELECT 'expenses_2026', COUNT(*) FROM expenses WHERE EXTRACT(year FROM created_at) = 2026;

