-- Availability becomes a status the manager sets by hand: a LOW_STOCK value replaces
-- the "only a few left" state derived from a tracked stock count, and the count goes.
--
-- The enum is rebuilt rather than extended with ADD VALUE, because a value added in a
-- transaction cannot be used by the data conversion in the same transaction.

-- The preorder check compares against the old enum type, so it is re-created afterwards
ALTER TABLE "products" DROP CONSTRAINT "products_preorder_lead_time_check";
ALTER TABLE "products" ALTER COLUMN "availability" DROP DEFAULT;

CREATE TYPE "product_availability_new" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'PREORDER', 'OUT_OF_STOCK');

-- Same rules the storefront used: zero tracked units is sold out, three or fewer is low
ALTER TABLE "products" ALTER COLUMN "availability" TYPE "product_availability_new" USING (
  CASE
    WHEN "availability" = 'IN_STOCK' AND "stock" = 0 THEN 'OUT_OF_STOCK'
    WHEN "availability" = 'IN_STOCK' AND "stock" <= 3 THEN 'LOW_STOCK'
    ELSE "availability"::text
  END
)::"product_availability_new";

DROP TYPE "product_availability";
ALTER TYPE "product_availability_new" RENAME TO "product_availability";

ALTER TABLE "products" ALTER COLUMN "availability" SET DEFAULT 'IN_STOCK';
ALTER TABLE "products"
  ADD CONSTRAINT "products_preorder_lead_time_check" CHECK ("availability" <> 'PREORDER' OR "lead_time_days" IS NOT NULL);

-- AlterTable
ALTER TABLE "products" DROP CONSTRAINT "products_stock_check";
ALTER TABLE "products" DROP COLUMN "stock";
