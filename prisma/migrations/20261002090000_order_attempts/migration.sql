-- CreateTable
CREATE TABLE "order_attempts" (
    "id" TEXT NOT NULL,
    "ip" TEXT,
    "phone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_attempts_ip_created_at_idx" ON "order_attempts"("ip", "created_at");

-- CreateIndex
CREATE INDEX "order_attempts_phone_created_at_idx" ON "order_attempts"("phone", "created_at");
