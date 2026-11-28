/*
  Warnings:

  - The primary key for the `auth_accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `auth_accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `sessions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `verifications` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `verifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "auth_accounts" DROP CONSTRAINT "auth_accounts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "verifications" DROP CONSTRAINT "verifications_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "verifications_pkey" PRIMARY KEY ("id");
