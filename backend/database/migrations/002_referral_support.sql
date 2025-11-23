-- Adds healthcare facilities, providers, and extends appointments for referral metadata

CREATE TABLE IF NOT EXISTS healthcare_facilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(120) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(60) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  facility_id INT NOT NULL,
  provider_name VARCHAR(160) NOT NULL,
  title VARCHAR(120) DEFAULT NULL,
  phone VARCHAR(60) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facility_id) REFERENCES healthcare_facilities(id) ON DELETE CASCADE
);

-- Add appointment columns if they don't already exist
-- Appointment columns
SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'service_code'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN service_code VARCHAR(80) NULL AFTER type;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'patient_age'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN patient_age INT NULL AFTER service_code;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'patient_phone'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN patient_phone VARCHAR(80) NULL AFTER patient_age;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'patient_sex'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN patient_sex ENUM(''male'',''female'',''other'') DEFAULT ''other'' AFTER patient_phone;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'patient_city'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN patient_city VARCHAR(120) NULL AFTER patient_sex;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'patient_address'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN patient_address VARCHAR(255) NULL AFTER patient_city;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'referring_facility_id'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN referring_facility_id INT NULL AFTER referral_note;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'referring_provider_id'
);
SET @sql := IF(@exist = 0, 'ALTER TABLE appointments ADD COLUMN referring_provider_id INT NULL AFTER referring_facility_id;', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Foreign keys
SET @exist := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND constraint_name = 'fk_appointments_facility'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_facility FOREIGN KEY (referring_facility_id) REFERENCES healthcare_facilities(id);',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND constraint_name = 'fk_appointments_provider'
);
SET @sql := IF(@exist = 0,
  'ALTER TABLE appointments ADD CONSTRAINT fk_appointments_provider FOREIGN KEY (referring_provider_id) REFERENCES facility_providers(id);',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO healthcare_facilities (name, city, address, phone) VALUES
  ('Mbabane Central Hospital', 'Mbabane', 'Hospital Road, Plot 12', '+268-2409-2000'),
  ('Manzini Referral Clinic', 'Manzini', 'Esser Street 45', '+268-2505-1100')
ON DUPLICATE KEY UPDATE city=VALUES(city), address=VALUES(address), phone=VALUES(phone);

INSERT INTO facility_providers (facility_id, provider_name, title, phone)
SELECT facility_id, provider_name, title, phone FROM (
  SELECT (SELECT id FROM healthcare_facilities WHERE name='Mbabane Central Hospital' LIMIT 1) AS facility_id,
         'Dr. Sibusiso Mamba' AS provider_name,
         'Chief Medical Officer' AS title,
         '+268-2409-2111' AS phone
  UNION ALL
  SELECT (SELECT id FROM healthcare_facilities WHERE name='Manzini Referral Clinic' LIMIT 1),
         'Dr. Lerato Dlamini','Consultant Physician','+268-2505-1120'
) seed
ON DUPLICATE KEY UPDATE title=VALUES(title), phone=VALUES(phone);
