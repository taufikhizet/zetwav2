/*
  Warnings:

  - You are about to drop the column `key` on the `api_keys` table. All the data in the column will be lost.
  - You are about to drop the column `permissions` on the `api_keys` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[keyHash]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `keyPrefix` to the `api_keys` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keySuffix` to the `api_keys` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "api_keys_key_idx";

-- DropIndex
DROP INDEX "api_keys_key_key";

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "key",
DROP COLUMN "permissions",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "keyPrefix" TEXT NOT NULL,
ADD COLUMN     "keySuffix" TEXT NOT NULL,
ADD COLUMN     "lastIpAddress" TEXT,
ADD COLUMN     "scopes" TEXT[] DEFAULT ARRAY['sessions:read', 'sessions:write', 'messages:send']::TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_expiresAt_idx" ON "api_keys"("expiresAt");
