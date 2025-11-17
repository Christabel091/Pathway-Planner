-- =============================================
-- FULL SQL SCHEMA (MATCHES YOUR PRISMA EXACTLY)
-- Updated 100% to your current schema.prisma
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL,
  UserName VARCHAR(150) NOT NULL,
  password_hash VARCHAR(72) NOT NULL,
  role ENUM ('patient','physician','caretaker','admin') NOT NULL,
  profileCompleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY email (email)
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
  inviteCode VARCHAR(191) NOT NULL,
  inviteUpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_clinicians_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_clinicians_user (user_id),
  UNIQUE KEY uq_clinicians_inviteCode (inviteCode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clinician_id INT NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  dob DATE NOT NULL,
  gender ENUM('male','female','other','prefer_not_say') DEFAULT 'prefer_not_say',
  phone_number VARCHAR(20),
  address VARCHAR(255),
  relative_contact_name VARCHAR(150),
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

  CONSTRAINT fk_patients_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_patients_clinician FOREIGN KEY (clinician_id)
    REFERENCES clinicians(id) ON DELETE RESTRICT,

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

  CONSTRAINT fk_caretakers_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY uq_caretakers_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PATIENT ↔ CARETAKER (M:N)
CREATE TABLE IF NOT EXISTS patient_caretakers (
  patient_id INT NOT NULL,
  caretaker_id INT NOT NULL,
  role_note VARCHAR(120),
  permissions VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patient_id, caretaker_id),
  
  CONSTRAINT fk_pc_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  CONSTRAINT fk_pc_caretaker FOREIGN KEY (caretaker_id)
    REFERENCES caretakers(id) ON DELETE CASCADE,

  INDEX fk_pc_caretaker (caretaker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- GOALS
CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('active','completed','pending_approval','cancelled') DEFAULT 'active',
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_goals_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  INDEX idx_goals_patient (patient_id)
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
  read_at DATETIME NULL,

  CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  INDEX idx_lab_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- MEDICINE (matches Prisma exactly)
CREATE TABLE IF NOT EXISTS medicine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  preferred_time VARCHAR(20),
  instructions VARCHAR(500),
  taken BOOLEAN NOT NULL DEFAULT FALSE,
  taken_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),

  CONSTRAINT Medicine_patient_id_fkey FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  INDEX Medicine_patient_id_fkey (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AI SUGGESTIONS
CREATE TABLE IF NOT EXISTS ai_suggestion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  goal_id INT NULL,
  suggested_delta_pct DECIMAL(6,2),
  confidence DECIMAL(5,2),
  requires_approval BOOLEAN DEFAULT FALSE,
  suggestion_text TEXT,
  trigger_reason VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ai_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  CONSTRAINT fk_ai_goal FOREIGN KEY (goal_id)
    REFERENCES goals(id) ON DELETE SET NULL,

  INDEX fk_ai_patient (patient_id),
  INDEX fk_ai_goal (goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PATIENT DAILY LOG
CREATE TABLE IF NOT EXISTS patient_daily_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  day_date DATE NOT NULL,
  sleep_hours DECIMAL(4,2),
  notes TEXT,
  exercise TEXT,
  meals TEXT,
  mood TINYINT,
  symptoms TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pdm_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,

  UNIQUE KEY uq_pdm_patient_day (patient_id, day_date),
  INDEX idx_pdm_patient_day (patient_id, day_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
