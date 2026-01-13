-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WebhookEvent" ADD VALUE 'message';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_any';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_ack';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_reaction';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_revoked';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_edited';
ALTER TYPE "WebhookEvent" ADD VALUE 'message_waiting';
ALTER TYPE "WebhookEvent" ADD VALUE 'session_status';
ALTER TYPE "WebhookEvent" ADD VALUE 'group_join';
ALTER TYPE "WebhookEvent" ADD VALUE 'group_leave';
ALTER TYPE "WebhookEvent" ADD VALUE 'group_update';
ALTER TYPE "WebhookEvent" ADD VALUE 'presence_update';
ALTER TYPE "WebhookEvent" ADD VALUE 'poll_vote';
ALTER TYPE "WebhookEvent" ADD VALUE 'poll_vote_failed';
ALTER TYPE "WebhookEvent" ADD VALUE 'call_received';
ALTER TYPE "WebhookEvent" ADD VALUE 'call_accepted';
ALTER TYPE "WebhookEvent" ADD VALUE 'call_rejected';
ALTER TYPE "WebhookEvent" ADD VALUE 'label_upsert';
ALTER TYPE "WebhookEvent" ADD VALUE 'label_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE 'label_chat_added';
ALTER TYPE "WebhookEvent" ADD VALUE 'label_chat_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE 'contact_update';
ALTER TYPE "WebhookEvent" ADD VALUE 'chat_archive';

-- AlterTable
ALTER TABLE "webhooks" ADD COLUMN     "metadata" JSONB;
