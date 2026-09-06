-- AlterTable
ALTER TABLE "affiliates" ADD COLUMN     "pagarmeRecipientId" TEXT;

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "splitMeta" JSONB;
