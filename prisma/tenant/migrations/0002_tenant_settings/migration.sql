-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "primaryColor" TEXT NOT NULL DEFAULT '#0f172a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f8fafc',
    "headline" TEXT NOT NULL DEFAULT 'Welcome',
    "description" TEXT NOT NULL DEFAULT 'This is your tenant landing page.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);
