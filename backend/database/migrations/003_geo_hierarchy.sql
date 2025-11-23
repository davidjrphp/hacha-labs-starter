-- Provinces, districts and enhanced facility metadata

CREATE TABLE IF NOT EXISTS provinces (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS districts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  province_id INT NOT NULL,
  name VARCHAR(160) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_province_district (province_id, name),
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

ALTER TABLE healthcare_facilities
  ADD COLUMN province_id INT NULL AFTER name,
  ADD COLUMN district_id INT NULL AFTER province_id,
  ADD COLUMN hmis_code VARCHAR(60) NULL AFTER district_id,
  ADD COLUMN mfl_code VARCHAR(60) NULL AFTER hmis_code,
  ADD CONSTRAINT fk_facilities_province FOREIGN KEY (province_id) REFERENCES provinces(id),
  ADD CONSTRAINT fk_facilities_district FOREIGN KEY (district_id) REFERENCES districts(id);
