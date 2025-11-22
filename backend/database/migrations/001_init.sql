-- ---------------------------------------------
-- Create database
-- ---------------------------------------------
DROP DATABASE IF EXISTS hacha_labs;
CREATE DATABASE hacha_labs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hacha_labs;

-- ---------------------------------------------
-- Roles table
-- ---------------------------------------------
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE
);

INSERT INTO roles (name) VALUES
  ('admin'),
  ('doctor'),
  ('patient'),
  ('referrer');

-- ---------------------------------------------
-- Users table
-- ---------------------------------------------
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  avatar VARCHAR(255),
  status ENUM('active','blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO users (role_id, full_name, email, password_hash, status) VALUES
  (1, 'System Administrator', 'admin@hacha-labs.com', '$2y$12$O.hqeruXEcSCktSTj9BZaubVAGzX2SqUMUwnHQj5qgJbVVGdMqMLO', 'active'),
  (2, 'Dr. Maya Patel', 'doctor@hacha-labs.com', '$2y$12$9m2n42B.u3bZYC69VJ9SdOtN7.M0n/rJVfOKq24Tn0NdShA9K5ey.', 'active');

-- ---------------------------------------------
-- Doctors table
-- ---------------------------------------------
CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE,
  specialty VARCHAR(100),
  bio TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ---------------------------------------------
-- Schedules table
-- ---------------------------------------------
CREATE TABLE schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  weekday TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

INSERT INTO doctors (user_id, specialty, bio) VALUES
  (
    (SELECT id FROM users WHERE email='doctor@hacha-labs.com' LIMIT 1),
    'Haematology',
    'Lead haematologist overseeing referral and diagnostic programs.'
  );

-- ---------------------------------------------
-- Appointments table
-- ---------------------------------------------
CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  requested_at DATETIME NOT NULL,
  slot_start DATETIME NOT NULL,
  slot_end DATETIME NOT NULL,
  type ENUM('new','returning','referral') NOT NULL,
  referral_note TEXT,
  referral_file VARCHAR(255),
  status ENUM('pending','approved','declined','completed') DEFAULT 'pending',
  status_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- ---------------------------------------------
-- Messages table
-- ---------------------------------------------
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- ---------------------------------------------
-- Staff table
-- ---------------------------------------------
CREATE TABLE staff (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  role_title VARCHAR(100) NOT NULL,
  photo_path VARCHAR(255) NOT NULL,
  bio TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- ---------------------------------------------
-- Media table
-- ---------------------------------------------
CREATE TABLE media (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('image','video') NOT NULL,
  path VARCHAR(255) NOT NULL,
  caption VARCHAR(160),
  is_hero BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------
-- News table
-- ---------------------------------------------
CREATE TABLE news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  body TEXT,
  cover_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE
);
