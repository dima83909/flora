-- AlterEnum
BEGIN;
CREATE TYPE "order_status_new" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_new" USING ("status"::text::"order_status_new");
ALTER TYPE "order_status" RENAME TO "order_status_old";
ALTER TYPE "order_status_new" RENAME TO "order_status";
DROP TYPE "public"."order_status_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_user_id_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_product_id_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_user_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_address_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_promo_code_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropIndex
DROP INDEX "orders_delivery_date_idx";

-- DropIndex
DROP INDEX "orders_promo_code_id_idx";

-- DropIndex
DROP INDEX "orders_user_id_created_at_idx";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "compare_at_price_minor",
DROP COLUMN "line_total_minor",
DROP COLUMN "product_composition",
DROP COLUMN "product_image_url",
ADD COLUMN     "composition" TEXT NOT NULL,
ADD COLUMN     "total_minor" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "address_id",
DROP COLUMN "cancelled_at",
DROP COLUMN "card_message",
DROP COLUMN "confirmed_at",
DROP COLUMN "customer_email",
DROP COLUMN "delivered_at",
DROP COLUMN "delivery_apartment",
DROP COLUMN "delivery_building",
DROP COLUMN "delivery_city",
DROP COLUMN "delivery_cost_minor",
DROP COLUMN "delivery_date",
DROP COLUMN "delivery_entrance",
DROP COLUMN "delivery_floor",
DROP COLUMN "delivery_intercom",
DROP COLUMN "delivery_method",
DROP COLUMN "delivery_slot_end",
DROP COLUMN "delivery_slot_start",
DROP COLUMN "delivery_street",
DROP COLUMN "delivery_zone",
DROP COLUMN "discount_minor",
DROP COLUMN "payment_status",
DROP COLUMN "promo_code",
DROP COLUMN "promo_code_id",
DROP COLUMN "recipient_name",
DROP COLUMN "recipient_phone",
DROP COLUMN "total_minor",
DROP COLUMN "user_id",
ADD COLUMN     "customer_city" TEXT NOT NULL,
ADD COLUMN     "manager_note" TEXT,
ALTER COLUMN "status" SET DEFAULT 'NEW';

-- DropTable
DROP TABLE "addresses";

-- DropTable
DROP TABLE "favorites";

-- DropTable
DROP TABLE "payments";

-- DropTable
DROP TABLE "promo_codes";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "delivery_method";

-- DropEnum
DROP TYPE "discount_type";

-- DropEnum
DROP TYPE "payment_provider";

-- DropEnum
DROP TYPE "payment_status";

-- DropEnum
DROP TYPE "user_role";

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_customer_phone_idx" ON "orders"("customer_phone");


-- ─── Hand-written invariants (not expressible in schema.prisma) ─────────────

-- Customer-facing order numbers start at 1001
ALTER SEQUENCE "orders_number_seq" RESTART WITH 1001;

-- Orders: required contact fields are never blank, phone is E.164, comment is bounded
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_subtotal_check" CHECK ("subtotal_minor" >= 0),
  ADD CONSTRAINT "orders_customer_name_check" CHECK (length(btrim("customer_name")) BETWEEN 1 AND 100),
  ADD CONSTRAINT "orders_customer_city_check" CHECK (length(btrim("customer_city")) BETWEEN 1 AND 100),
  ADD CONSTRAINT "orders_customer_phone_check" CHECK ("customer_phone" ~ '^\+[1-9][0-9]{7,14}$'),
  ADD CONSTRAINT "orders_customer_comment_check" CHECK ("customer_comment" IS NULL OR length("customer_comment") <= 1000),
  ADD CONSTRAINT "orders_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

-- Order items: line total matches price × quantity (quantity > 0 is enforced since init)
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_amounts_check" CHECK ("unit_price_minor" >= 0 AND "total_minor" = "unit_price_minor" * "quantity");
