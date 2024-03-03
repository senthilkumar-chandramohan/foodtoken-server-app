-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "picture" TEXT,
ADD COLUMN     "privateKey" TEXT,
ALTER COLUMN "vapidKeys" DROP NOT NULL,
ALTER COLUMN "subscription" DROP NOT NULL;
