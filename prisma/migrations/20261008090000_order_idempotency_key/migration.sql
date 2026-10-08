-- Random key the checkout sends with each order; a retried submission finds the order
-- already placed with it instead of creating a duplicate. Older orders have none (NULL),
-- and a unique index allows any number of NULLs.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "idempotency_key" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
