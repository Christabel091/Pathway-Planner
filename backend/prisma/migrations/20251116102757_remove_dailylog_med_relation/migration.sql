/*
  Warnings:

  - You are about to drop the column `patientDailyLogId` on the `medicine` table. All the data in the column will be lost.
  - Made the column `medicine_name` on table `medicine` required. This step will fail if there are existing NULL values in that column.
  - Made the column `taken` on table `medicine` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `medicine_patientDailyLogId_fkey`;

-- DropForeignKey
ALTER TABLE `medicine` DROP FOREIGN KEY `medicine_patient_id_fkey`;

-- DropIndex
DROP INDEX `medicine_patientDailyLogId_fkey` ON `medicine`;

-- AlterTable
ALTER TABLE `medicine` DROP COLUMN `patientDailyLogId`,
    ADD COLUMN `dosage` VARCHAR(100) NULL,
    ADD COLUMN `frequency` VARCHAR(100) NULL,
    ADD COLUMN `instructions` VARCHAR(500) NULL,
    ADD COLUMN `preferred_time` VARCHAR(20) NULL,
    MODIFY `medicine_name` VARCHAR(200) NOT NULL,
    MODIFY `taken` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `taken_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `Medicine` ADD CONSTRAINT `Medicine_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `medicine` RENAME INDEX `medicine_patient_id_idx` TO `Medicine_patient_id_idx`;
