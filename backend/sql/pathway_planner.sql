-- Safety first
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  UserName VARCHAR(150) NOT NULL,
  password_hash VARCHAR(250) NOT NULL,
  role ENUM ('patient','physician','caretaker','admin') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- CLINICIANS
CREATE TABLE IF NOT EXISTS clinicians (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  specialty VARCHAR(120),
  license_number VARCHAR(100),
  clinic_name VARCHAR(150),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(20),
  office_address VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinicians_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_clinicians_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PATIENTS (now requires exactly one clinician)
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clinician_id INT NOT NULL,  -- enforce 1 doctor per patient
  full_name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male','female','other','prefer_not_say') DEFAULT 'prefer_not_say',
  phone_number VARCHAR(20),
  address VARCHAR(255),

  relative_contact_name  VARCHAR(150),
  relative_contact_email VARCHAR(150),
  relative_contact_phone VARCHAR(20),

  blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,

  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_patients_user      FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_patients_clinician FOREIGN KEY (clinician_id) REFERENCES clinicians(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_patients_user (user_id),
  INDEX idx_patients_clinician (clinician_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- CARETAKERS
CREATE TABLE IF NOT EXISTS caretakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  relationship VARCHAR(80),
  phone_number VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_caretakers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_caretakers_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PATIENT ↔ CARETAKER (M:N)
CREATE TABLE IF NOT EXISTS patient_caretakers (
  patient_id   INT NOT NULL,
  caretaker_id INT NOT NULL,
  role_note    VARCHAR(120),
  permissions  SET('view_goals','view_journal','add_checkins'),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patient_id, caretaker_id),
  CONSTRAINT fk_pc_patient   FOREIGN KEY (patient_id)   REFERENCES patients(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pc_caretaker FOREIGN KEY (caretaker_id) REFERENCES caretakers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- GOALS
CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('active','paused','completed','cancelled') DEFAULT 'active',
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goals_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_goals_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- GOAL VERSIONS
CREATE TABLE IF NOT EXISTS goal_version (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goal_id INT NOT NULL,
  proposed_by_id INT NULL,
  version_number INT NOT NULL,
  target_per_week INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gv_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  CONSTRAINT fk_gv_user FOREIGN KEY (proposed_by_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_gv_goal_version (goal_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- JOURNAL
CREATE TABLE IF NOT EXISTS journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  goal_id INT NULL,
  title VARCHAR(200),
  body TEXT NOT NULL,
  mood TINYINT,
  visibility ENUM('private','care_team') DEFAULT 'private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_journal_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_journal_goal    FOREIGN KEY (goal_id)    REFERENCES goals(id)     ON DELETE SET NULL,
  INDEX idx_journal_patient_created (patient_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- APPROVAL (standalone)
CREATE TABLE IF NOT EXISTS approval (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  note VARCHAR(200),
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- LAB RESULTS
CREATE TABLE IF NOT EXISTS lab_result (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  lab_type VARCHAR(100),
  lab_value DECIMAL(10,2),
  unit VARCHAR(100),
  source VARCHAR(255),
  file_url VARCHAR(255),
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  INDEX idx_lab_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- DAILY ANCHOR
CREATE TABLE IF NOT EXISTS patient_daily_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  day_date DATE NOT NULL,
  sleep_hours DECIMAL(4,2) NULL,
  notes TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pdm_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT uq_pdm_patient_day UNIQUE (patient_id, day_date),
  INDEX idx_pdm_patient_day (patient_id, day_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- MEAL (linked to day)
CREATE TABLE IF NOT EXISTS meal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  foodname VARCHAR(200),
  profile_image VARCHAR(255),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  patient_daily_id INT NULL,
  CONSTRAINT fk_meal_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_meal_daily   FOREIGN KEY (patient_daily_id) REFERENCES patient_daily_metrics(id) ON DELETE SET NULL,
  INDEX idx_meal_patient_created (patient_id, created_at),
  INDEX idx_meal_daily (patient_daily_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- MEDICINE (linked to day)
CREATE TABLE IF NOT EXISTS medicine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_name VARCHAR(200),
  taken BOOLEAN DEFAULT FALSE,
  taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  patient_daily_id INT NULL,
  CONSTRAINT fk_medicine_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_medicine_daily   FOREIGN KEY (patient_daily_id) REFERENCES patient_daily_metrics(id) ON DELETE SET NULL,
  INDEX idx_medicine_daily (patient_daily_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- SYMPTOM LOG (linked to day)
CREATE TABLE IF NOT EXISTS symptom_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  symptoms VARCHAR(200),
  severity INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  patient_daily_id INT NULL,
  CONSTRAINT fk_symptom_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_symptom_daily   FOREIGN KEY (patient_daily_id) REFERENCES patient_daily_metrics(id) ON DELETE SET NULL,
  INDEX idx_symptom_patient_created (patient_id, created_at),
  INDEX idx_symptom_daily (patient_daily_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- GOAL PROGRESS (per goal per day)
CREATE TABLE IF NOT EXISTS goal_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goal_id INT NOT NULL,
  patient_daily_id INT NOT NULL,
  value_decimal DECIMAL(10,2) NULL,
  value_bool TINYINT(1) NULL,
  notes VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gp_goal  FOREIGN KEY (goal_id)          REFERENCES goals(id)                 ON DELETE CASCADE,
  CONSTRAINT fk_gp_daily FOREIGN KEY (patient_daily_id) REFERENCES patient_daily_metrics(id) ON DELETE CASCADE,
  CONSTRAINT uq_gp_goal_day UNIQUE (goal_id, patient_daily_id),
  INDEX idx_gp_daily (patient_daily_id),
  INDEX idx_gp_goal  (goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AI SUGGESTION
CREATE TABLE IF NOT EXISTS ai_suggestion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  goal_id INT,
  suggested_delta_pct DECIMAL(6,2),
  confidence DECIMAL(5,2),
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_goal    FOREIGN KEY (goal_id)    REFERENCES goals(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) PRIMARY KEY,
  actor_user_id INT NOT NULL,
  actiontype VARCHAR(255) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  diff JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
