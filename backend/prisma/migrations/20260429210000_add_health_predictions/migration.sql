-- CreateTable
CREATE TABLE "health_predictions" (
    "id" TEXT NOT NULL,
    "resident_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "heart_rate" INTEGER,
    "temperature" DOUBLE PRECISION,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "spo2" INTEGER,
    "fall_risk" DOUBLE PRECISION,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_predictions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "health_predictions" ADD CONSTRAINT "health_predictions_resident_id_fkey" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE CASCADE ON UPDATE CASCADE;