-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "dim_campaigns" (
    "id" TEXT NOT NULL,
    "ad_account_id" TEXT NOT NULL,
    "campaign_group_id" TEXT,
    "name" TEXT NOT NULL,
    "objective_type" TEXT,
    "format" TEXT,
    "status" TEXT,
    "budget_amount" DECIMAL(12,2),
    "currency" TEXT,
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "dim_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_creatives" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "format" TEXT,
    "headline" TEXT,
    "pillar" TEXT,
    "status" TEXT,
    "start_date" DATE,

    CONSTRAINT "dim_creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_paid_analytics" (
    "id" BIGSERIAL NOT NULL,
    "creative_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "impressions" BIGINT DEFAULT 0,
    "clicks" BIGINT DEFAULT 0,
    "reach" BIGINT DEFAULT 0,
    "likes" BIGINT DEFAULT 0,
    "comments" BIGINT DEFAULT 0,
    "shares" BIGINT DEFAULT 0,
    "follows" BIGINT DEFAULT 0,
    "cost" DECIMAL(12,2) DEFAULT 0,

    CONSTRAINT "fact_paid_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_organic_posts" (
    "id" TEXT NOT NULL,
    "published_at" DATE NOT NULL,
    "type" TEXT,
    "headline" TEXT,
    "impressions" BIGINT DEFAULT 0,
    "clicks" BIGINT DEFAULT 0,
    "likes" BIGINT DEFAULT 0,
    "comments" BIGINT DEFAULT 0,
    "shares" BIGINT DEFAULT 0,
    "engagement_rate" DECIMAL(6,4) DEFAULT 0,
    "was_boosted" BOOLEAN DEFAULT false,
    "boosted_by_campaign_id" TEXT,

    CONSTRAINT "fact_organic_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_follower_stats" (
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "organic_follower_gain" BIGINT DEFAULT 0,
    "paid_follower_gain" BIGINT DEFAULT 0,
    "total_followers" BIGINT DEFAULT 0,

    CONSTRAINT "fact_follower_stats_pkey" PRIMARY KEY ("date_start","date_end")
);

-- CreateIndex
CREATE UNIQUE INDEX "fact_paid_analytics_creative_id_date_start_date_end_key" ON "fact_paid_analytics"("creative_id", "date_start", "date_end");

-- AddForeignKey
ALTER TABLE "dim_creatives" ADD CONSTRAINT "dim_creatives_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dim_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fact_paid_analytics" ADD CONSTRAINT "fact_paid_analytics_creative_id_fkey" FOREIGN KEY ("creative_id") REFERENCES "dim_creatives"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fact_paid_analytics" ADD CONSTRAINT "fact_paid_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "dim_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fact_organic_posts" ADD CONSTRAINT "fact_organic_posts_boosted_by_campaign_id_fkey" FOREIGN KEY ("boosted_by_campaign_id") REFERENCES "dim_campaigns"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

