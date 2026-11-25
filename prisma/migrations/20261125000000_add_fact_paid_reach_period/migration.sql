-- CreateTable
CREATE TABLE "fact_paid_reach_period" (
    "id" BIGSERIAL NOT NULL,
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "reach" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_paid_reach_period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fact_paid_reach_period_date_start_date_end_key" ON "fact_paid_reach_period"("date_start", "date_end");
