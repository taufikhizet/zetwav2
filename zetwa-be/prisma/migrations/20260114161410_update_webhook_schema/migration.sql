/*
  Warnings:

  - You are about to drop the column `headers` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `retryCount` on the `webhooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "webhooks" DROP COLUMN "headers",
DROP COLUMN "metadata",
DROP COLUMN "retryCount",
ADD COLUMN     "customHeaders" JSONB,
ADD COLUMN     "retryAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "retryDelay" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "retryPolicy" TEXT NOT NULL DEFAULT 'linear';
