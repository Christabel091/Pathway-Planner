DROP DATABASE pathway_planner;

#creating the database
create database pathway_planner
	character set utf8mb4 #we can store diff languages and also emojis with this. increases range
    collate utf8mb4_0900_ai_ci; #for comparing and sorting teexts. alter
								#ai for accent insensitive (é = e)
                                #ci for case insensitive (A=a)
				
use pathway_planner;


#Starting from the login page:

create table USERS
(
	id INT auto_increment primary key,
	email VARCHAR(150) not null unique,
    UserName VARCHAR(150) NOT NULL,
	password_hash VARBINARY(250) not null,
	role ENUM ('patient','physician','caretaker','admin') not null,
	created_at datetime default current_timestamp,
    updated_at datetime default current_timestamp on update current_timestamp
    
);

#table for patients
create table patients
(
    id INT AUTO_INCREMENT PRIMARY KEY,             -- MAIN PATIENT ID
    user_id INT NOT NULL,                          
    full_name VARCHAR(150) NOT NULL,
    dob DATE NOT NULL,
    gender ENUM('male','female','other','prefer_not_say') DEFAULT 'prefer_not_say',
    phone_number VARCHAR(20),
    address VARCHAR(255),

	relative_contact_name VARCHAR(150),
    relative_contact_email VARCHAR(150),
    relative_contact_phone VARCHAR(20),

    blood_type ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
    allergies TEXT,                                -- list or description
    chronic_conditions TEXT,                       -- e.g. diabetes, hypertension
    current_medications TEXT,                      

    height_cm DECIMAL(5,2),                        -- store in cm
    weight_kg DECIMAL(5,2),                        -- store in kg

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE caretakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                               -- caretaker’s user account
  full_name VARCHAR(150) NOT NULL,
  relationship VARCHAR(80),                           -- e.g., nurse, parent, friend
  phone_number VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_caretakers_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_caretakers_user (user_id)
);

CREATE TABLE patient_caretakers (
  patient_id   INT NOT NULL,
  caretaker_id INT NOT NULL,
  role_note    VARCHAR(120),
  permissions  SET('view_goals','view_journal','add_checkins'),
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (patient_id, caretaker_id),
  CONSTRAINT fk_pc_patient   FOREIGN KEY (patient_id)
    REFERENCES patients(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pc_caretaker FOREIGN KEY (caretaker_id)
    REFERENCES caretakers(id) ON DELETE CASCADE
);

CREATE TABLE goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('active','paused','completed','cancelled') DEFAULT 'active',
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_goals_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);

CREATE TABLE goal_version (
  id INT AUTO_INCREMENT PRIMARY KEY,
  goal_id INT NOT NULL,
  proposed_by_id INT,
  version_number INT NOT NULL,
  target_per_week INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gv_goal  FOREIGN KEY (goal_id)
    REFERENCES goals(id) ON DELETE CASCADE,
  CONSTRAINT fk_gv_user  FOREIGN KEY (proposed_by_id)
    REFERENCES users(id)
);


CREATE TABLE journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  goal_id INT,
  title VARCHAR(200),
  body TEXT NOT NULL,
  mood TINYINT,                                       -- 1–5 scale
  visibility ENUM('private','care_team') DEFAULT 'private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_journal_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_journal_goal FOREIGN KEY (goal_id)
    REFERENCES goals(id) ON DELETE SET NULL
);

CREATE TABLE approval (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  note VARCHAR(200),
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_result (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  lab_type VARCHAR(100),
  lab_value DECIMAL(10,2),
  unit VARCHAR(100),
  source VARCHAR(255),
  file_url VARCHAR(255),
  decided_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);


CREATE TABLE medicine (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medicine_name VARCHAR(200),
  taken BOOLEAN DEFAULT FALSE,
  taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_medicine_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);


CREATE TABLE symptom_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  symptoms VARCHAR(200),
  severity INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_symptom_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);


CREATE TABLE meal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  foodname VARCHAR(200),
  profile_image VARCHAR(255),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_meal_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);


CREATE TABLE ai_suggestion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  goal_id INT,
  suggested_delta_pct DECIMAL(6,2),
  confidence DECIMAL(5,2),
  requires_approval BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ai_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_ai_goal FOREIGN KEY (goal_id)
    REFERENCES goals(id) ON DELETE SET NULL
);



CREATE TABLE audit_log (
  id CHAR(36) PRIMARY KEY,                            -- UUID string
  actor_user_id INT NOT NULL,
  actiontype VARCHAR(255) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  diff JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id)
    REFERENCES users(id)
);


#bankofAmerica
#chase
#JPMorgan International



