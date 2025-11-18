/*
  Warnings:

  - The values [paused] on the enum `goals_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `patient_daily_id` on the `medicine` table. All the data in the column will be lost.
  - You are about to alter the column `password_hash` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarBinary(250)` to `VarChar(72)`.
  - You are about to drop the `audit_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goal_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goal_version` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `meal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `symptom_log` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[inviteCode]` on the table `clinicians` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inviteCode` to the `clinicians` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `audit_log` DROP FOREIGN KEY `fk_audit_actor`;

-- DropForeignKey
ALTER TABLE `goal_progress` DROP FOREIGN KEY `fk_gp_daily`;

-- DropForeignKey
ALTER TABLE `goal_progress` DROP FOREIGN KEY `fk_gp_goal`;

-- DropForeignKey
ALTER TABLE `goal_version` DROP FOREIGN KEY `fk_gv_goal`;

-- DropForeignKey
ALTER TABLE `goal_version` DROP FOREIGN KEY `fk_gv_user`;

-- DropForeignKey
ALTER TABLE `journal_entries` DROP FOREIGN KEY `fk_journal_goal`;

-- DropForeignKey
ALTER TABLE `journal_entries` DROP FOREIGN KEY `fk_journal_patient`;

-- DropForeignKey
ALTER TABLE `meal` DROP FOREIGN KEY `fk_meal_daily`;

-- DropForeignKey
ALTER TABLE `meal` DROP FOREIGN KEY `fk_meal_patient`;

-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `fk_medicine_daily`;

-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `fk_medicine_patient`;

-- DropForeignKey
ALTER TABLE `symptom_log` DROP FOREIGN KEY `fk_symptom_daily`;

-- DropForeignKey
ALTER TABLE `symptom_log` DROP FOREIGN KEY `fk_symptom_patient`;

-- DropIndex
DROP INDEX `idx_medicine_daily` ON `medicine`;

-- AlterTable
ALTER TABLE `clinicians` ADD COLUMN `inviteCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `inviteUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `goals` MODIFY `status` ENUM('active', 'completed', 'pending_approval', 'cancelled') NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `lab_result` ADD COLUMN `read_at` DATETIME(0) NULL;

-- AlterTable
ALTER TABLE `medicine` DROP COLUMN `patient_daily_id`,
    ADD COLUMN `patientDailyLogId` INTEGER NULL;

-- AlterTable
ALTER TABLE `patient_daily_metrics` ADD COLUMN `exercise` TEXT NULL,
    ADD COLUMN `meals` TEXT NULL,
    ADD COLUMN `mood` TINYINT NULL,
    ADD COLUMN `symptoms` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `profileCompleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `password_hash` VARCHAR(72) NOT NULL;

-- DropTable
DROP TABLE `audit_log`;

-- DropTable
DROP TABLE `goal_progress`;

-- DropTable
DROP TABLE `goal_version`;

-- DropTable
DROP TABLE `journal_entries`;

-- DropTable
DROP TABLE `meal`;

-- DropTable
DROP TABLE `symptom_log`;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('LAB_NEW', 'GOAL_APPROVED', 'MEDICATION', 'MESSAGE') NOT NULL,
    `entity` VARCHAR(64) NULL,
    `entity_id` INTEGER NULL,
    `payload` JSON NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `delivered_at` DATETIME(0) NULL,
    `read_at` DATETIME(0) NULL,

    INDEX `idx_notifications_user_created`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `clinicians_inviteCode_key` ON `clinicians`(`inviteCode`);

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `medicine_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicine` ADD CONSTRAINT `medicine_patientDailyLogId_fkey` FOREIGN KEY (`patientDailyLogId`) REFERENCES `patient_daily_metrics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `medicine` RENAME INDEX `fk_medicine_patient` TO `medicine_patient_id_idx`;
