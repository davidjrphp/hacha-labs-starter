CREATE TABLE IF NOT EXISTS staff_titles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL UNIQUE,
  category VARCHAR(80) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO staff_titles (name, category) VALUES
  ('Laboratory Director', 'Management'),
  ('Laboratory Manager / Administrator', 'Management'),
  ('Section Head / Supervisor / Team Leader', 'Management'),
  ('Medical Laboratory Scientist', 'Technical'),
  ('Medical Laboratory Technician', 'Technical'),
  ('Specialized Technologist', 'Technical'),
  ('Pathologist Assistant', 'Technical'),
  ('Phlebotomist / Phlebotomy Technician', 'Technical'),
  ('Laboratory Assistant / Support Services Clerk', 'Support'),
  ('Specimen Processor', 'Support'),
  ('Clerical Worker / Administrative Secretary', 'Support'),
  ('Quality Assurance / Compliance Director', 'Other'),
  ('Biochemist / Chemist', 'Other')
ON DUPLICATE KEY UPDATE category = VALUES(category);

ALTER TABLE staff
  ADD COLUMN staff_title_id INT NULL AFTER role_title,
  ADD COLUMN email VARCHAR(160) NULL UNIQUE AFTER staff_title_id,
  ADD COLUMN user_id INT NULL AFTER email,
  ADD CONSTRAINT fk_staff_title FOREIGN KEY (staff_title_id) REFERENCES staff_titles(id),
  ADD CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id);
