-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(150) NOT NULL,
    `UserName` VARCHAR(150) NOT NULL,
    `password_hash` VARBINARY(250) NOT NULL,
    `role` ENUM('patient', 'physician', 'caretaker', 'admin') NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `clinician_id` INTEGER NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `dob` DATE NOT NULL,
    `gender` ENUM('male', 'female', 'other', 'prefer_not_say') NULL DEFAULT 'prefer_not_say',
    `phone_number` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `relative_contact_name` VARCHAR(150) NULL,
    `relative_contact_email` VARCHAR(150) NULL,
    `relative_contact_phone` VARCHAR(20) NULL,
    `blood_type` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
    `allergies` TEXT NULL,
    `chronic_conditions` TEXT NULL,
    `current_medications` TEXT NULL,
    `height_cm` DECIMAL(5, 2) NULL,
    `weight_kg` DECIMAL(5, 2) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_patients_user`(`user_id`),
    INDEX `idx_patients_clinician`(`clinician_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clinicians` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `specialty` VARCHAR(120) NULL,
    `license_number` VARCHAR(100) NULL,
    `clinic_name` VARCHAR(150) NULL,
    `contact_email` VARCHAR(150) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `office_address` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_clinicians_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `caretakers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `relationship` VARCHAR(80) NULL,
    `phone_number` VARCHAR(20) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_caretakers_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_caretakers` (
    `patient_id` INTEGER NOT NULL,
    `caretaker_id` INTEGER NOT NULL,
    `role_note` VARCHAR(120) NULL,
    `permissions` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_pc_caretaker`(`caretaker_id`),
    PRIMARY KEY (`patient_id`, `caretaker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('active', 'paused', 'completed', 'cancelled') NULL DEFAULT 'active',
    `due_date` DATE NULL,
    `completed` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_goals_patient`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goal_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `goal_id` INTEGER NOT NULL,
    `proposed_by_id` INTEGER NULL,
    `version_number` INTEGER NOT NULL,
    `target_per_week` INTEGER NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_gv_user`(`proposed_by_id`),
    UNIQUE INDEX `uq_gv_goal_version`(`goal_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `journal_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `goal_id` INTEGER NULL,
    `title` VARCHAR(200) NULL,
    `body` TEXT NOT NULL,
    `mood` TINYINT NULL,
    `visibility` ENUM('private', 'care_team') NULL DEFAULT 'private',
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_journal_goal`(`goal_id`),
    INDEX `idx_journal_patient_created`(`patient_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `note` VARCHAR(200) NULL,
    `decided_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lab_result` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `lab_type` VARCHAR(100) NULL,
    `lab_value` DECIMAL(10, 2) NULL,
    `unit` VARCHAR(100) NULL,
    `source` VARCHAR(255) NULL,
    `file_url` VARCHAR(255) NULL,
    `decided_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_lab_patient`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `medicine_name` VARCHAR(200) NULL,
    `taken` BOOLEAN NULL DEFAULT false,
    `taken_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `patient_daily_id` INTEGER NULL,

    INDEX `fk_medicine_patient`(`patient_id`),
    INDEX `idx_medicine_daily`(`patient_daily_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptom_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `symptoms` VARCHAR(200) NULL,
    `severity` INTEGER NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `patient_daily_id` INTEGER NULL,

    INDEX `idx_symptom_daily`(`patient_daily_id`),
    INDEX `idx_symptom_patient_created`(`patient_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `foodname` VARCHAR(200) NULL,
    `profile_image` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `patient_daily_id` INTEGER NULL,

    INDEX `idx_meal_daily`(`patient_daily_id`),
    INDEX `idx_meal_patient_created`(`patient_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_suggestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `goal_id` INTEGER NULL,
    `suggested_delta_pct` DECIMAL(6, 2) NULL,
    `confidence` DECIMAL(5, 2) NULL,
    `requires_approval` BOOLEAN NULL DEFAULT false,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_ai_goal`(`goal_id`),
    INDEX `fk_ai_patient`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` CHAR(36) NOT NULL,
    `actor_user_id` INTEGER NOT NULL,
    `actiontype` VARCHAR(255) NOT NULL,
    `entity` VARCHAR(255) NOT NULL,
    `entity_id` CHAR(36) NOT NULL,
    `diff` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_actor`(`actor_user_id`),
    INDEX `idx_audit_created`(`created_at`),
    INDEX `idx_audit_entity`(`entity`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_daily_metrics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `day_date` DATE NOT NULL,
    `sleep_hours` DECIMAL(4, 2) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_pdm_patient_day`(`patient_id`, `day_date`),
    UNIQUE INDEX `uq_pdm_patient_day`(`patient_id`, `day_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goal_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `goal_id` INTEGER NOT NULL,
    `patient_daily_id` INTEGER NOT NULL,
    `value_decimal` DECIMAL(10, 2) NULL,
    `value_bool` BOOLEAN NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_gp_daily`(`patient_daily_id`),
    INDEX `idx_gp_goal`(`goal_id`),
    UNIQUE INDEX `uq_gp_goal_day`(`goal_id`, `patient_daily_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `fk_patients_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patients` ADD CONSTRAINT `fk_patients_clinician` FOREIGN KEY (`clinician_id`) REFERENCES `clinicians`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `clinicians` ADD CONSTRAINT `fk_clinicians_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `caretakers` ADD CONSTRAINT `fk_caretakers_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_caretakers` ADD CONSTRAINT `fk_pc_caretaker` FOREIGN KEY (`caretaker_id`) REFERENCES `caretakers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_caretakers` ADD CONSTRAINT `fk_pc_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `goals` ADD CONSTRAINT `fk_goals_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `goal_version` ADD CONSTRAINT `fk_gv_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `goal_version` ADD CONSTRAINT `fk_gv_user` FOREIGN KEY (`proposed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `fk_journal_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `journal_entries` ADD CONSTRAINT `fk_journal_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `lab_result` ADD CONSTRAINT `fk_lab_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `fk_medicine_daily` FOREIGN KEY (`patient_daily_id`) REFERENCES `patient_daily_metrics`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `fk_medicine_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `symptom_log` ADD CONSTRAINT `fk_symptom_daily` FOREIGN KEY (`patient_daily_id`) REFERENCES `patient_daily_metrics`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `symptom_log` ADD CONSTRAINT `fk_symptom_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meal` ADD CONSTRAINT `fk_meal_daily` FOREIGN KEY (`patient_daily_id`) REFERENCES `patient_daily_metrics`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `meal` ADD CONSTRAINT `fk_meal_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ai_suggestion` ADD CONSTRAINT `fk_ai_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ai_suggestion` ADD CONSTRAINT `fk_ai_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `patient_daily_metrics` ADD CONSTRAINT `fk_pdm_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `goal_progress` ADD CONSTRAINT `fk_gp_daily` FOREIGN KEY (`patient_daily_id`) REFERENCES `patient_daily_metrics`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `goal_progress` ADD CONSTRAINT `fk_gp_goal` FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
