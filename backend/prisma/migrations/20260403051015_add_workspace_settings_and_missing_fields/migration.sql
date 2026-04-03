/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[supabaseUserId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Cleaner" DROP CONSTRAINT "Cleaner_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_customerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- AlterTable
ALTER TABLE "Cleaner" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "defaultEndTime" TEXT,
ADD COLUMN     "defaultStartTime" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "hourlyRate" DOUBLE PRECISION,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVisibleOnSchedule" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "labourCost" DOUBLE PRECISION,
ADD COLUMN     "maxJobsPerDay" INTEGER,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "role" TEXT DEFAULT 'Cleaner',
ADD COLUMN     "serviceArea" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "teamId" INTEGER,
ADD COLUMN     "workspaceId" INTEGER,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "defaultWorkspaceId" INTEGER,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'basic',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "supabaseUserId" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingCountry" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "billingSameAsProperty" BOOLEAN DEFAULT true,
ADD COLUMN     "billingState" TEXT,
ADD COLUMN     "billingStreet1" TEXT,
ADD COLUMN     "billingStreet2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street1" TEXT,
ADD COLUMN     "street2" TEXT,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "workspaceId" INTEGER,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "anytime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "balanceDue" DOUBLE PRECISION,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderNo" TEXT,
ADD COLUMN     "paidAmount" DOUBLE PRECISION,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentStatus" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "subtotal" DOUBLE PRECISION,
ADD COLUMN     "taxAmount" DOUBLE PRECISION,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "total" DOUBLE PRECISION,
ADD COLUMN     "workspaceId" INTEGER,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER,
    "supabaseUserId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "phone" TEXT,
    "permissionsJson" JSONB,
    "isPrimaryOwner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER,
    "name" TEXT NOT NULL,
    "leaderName" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAvailability" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER,
    "cleanerId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isOff" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdBy" TEXT,
    "source" TEXT,
    "externalRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceSettings" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "companyName" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "street1" TEXT,
    "street2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "dateFormat" TEXT,
    "timeFormat" TEXT,
    "firstDayOfWeek" TEXT,
    "showBusinessHours" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "secondaryColor" TEXT,
    "currency" TEXT,
    "language" TEXT,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "publicBookingUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceBusinessHour" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceBusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceTaxProfile" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "taxName" TEXT,
    "taxNumber" TEXT,
    "taxRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceTaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workspace_companyId_idx" ON "Workspace"("companyId");

-- CreateIndex
CREATE INDEX "Workspace_slug_idx" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "Workspace_isActive_idx" ON "Workspace"("isActive");

-- CreateIndex
CREATE INDEX "Workspace_source_idx" ON "Workspace"("source");

-- CreateIndex
CREATE INDEX "Workspace_externalRef_idx" ON "Workspace"("externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_supabaseUserId_key" ON "CompanyUser"("supabaseUserId");

-- CreateIndex
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");

-- CreateIndex
CREATE INDEX "CompanyUser_workspaceId_idx" ON "CompanyUser"("workspaceId");

-- CreateIndex
CREATE INDEX "CompanyUser_role_idx" ON "CompanyUser"("role");

-- CreateIndex
CREATE INDEX "CompanyUser_status_idx" ON "CompanyUser"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_companyId_email_key" ON "CompanyUser"("companyId", "email");

-- CreateIndex
CREATE INDEX "Team_companyId_idx" ON "Team"("companyId");

-- CreateIndex
CREATE INDEX "Team_workspaceId_idx" ON "Team"("workspaceId");

-- CreateIndex
CREATE INDEX "Team_isActive_idx" ON "Team"("isActive");

-- CreateIndex
CREATE INDEX "Team_source_idx" ON "Team"("source");

-- CreateIndex
CREATE INDEX "Team_externalRef_idx" ON "Team"("externalRef");

-- CreateIndex
CREATE INDEX "Team_isArchived_idx" ON "Team"("isArchived");

-- CreateIndex
CREATE INDEX "CleanerAvailability_companyId_idx" ON "CleanerAvailability"("companyId");

-- CreateIndex
CREATE INDEX "CleanerAvailability_workspaceId_idx" ON "CleanerAvailability"("workspaceId");

-- CreateIndex
CREATE INDEX "CleanerAvailability_cleanerId_idx" ON "CleanerAvailability"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerAvailability_date_idx" ON "CleanerAvailability"("date");

-- CreateIndex
CREATE INDEX "CleanerAvailability_source_idx" ON "CleanerAvailability"("source");

-- CreateIndex
CREATE INDEX "CleanerAvailability_externalRef_idx" ON "CleanerAvailability"("externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerAvailability_cleanerId_date_key" ON "CleanerAvailability"("cleanerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSettings_workspaceId_key" ON "WorkspaceSettings"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceSettings_companyId_idx" ON "WorkspaceSettings"("companyId");

-- CreateIndex
CREATE INDEX "WorkspaceSettings_workspaceId_idx" ON "WorkspaceSettings"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceBusinessHour_companyId_idx" ON "WorkspaceBusinessHour"("companyId");

-- CreateIndex
CREATE INDEX "WorkspaceBusinessHour_workspaceId_idx" ON "WorkspaceBusinessHour"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceBusinessHour_dayOfWeek_idx" ON "WorkspaceBusinessHour"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceBusinessHour_workspaceId_dayOfWeek_key" ON "WorkspaceBusinessHour"("workspaceId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceTaxProfile_workspaceId_key" ON "WorkspaceTaxProfile"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceTaxProfile_companyId_idx" ON "WorkspaceTaxProfile"("companyId");

-- CreateIndex
CREATE INDEX "WorkspaceTaxProfile_workspaceId_idx" ON "WorkspaceTaxProfile"("workspaceId");

-- CreateIndex
CREATE INDEX "Cleaner_companyId_idx" ON "Cleaner"("companyId");

-- CreateIndex
CREATE INDEX "Cleaner_workspaceId_idx" ON "Cleaner"("workspaceId");

-- CreateIndex
CREATE INDEX "Cleaner_teamId_idx" ON "Cleaner"("teamId");

-- CreateIndex
CREATE INDEX "Cleaner_status_idx" ON "Cleaner"("status");

-- CreateIndex
CREATE INDEX "Cleaner_email_idx" ON "Cleaner"("email");

-- CreateIndex
CREATE INDEX "Cleaner_role_idx" ON "Cleaner"("role");

-- CreateIndex
CREATE INDEX "Cleaner_source_idx" ON "Cleaner"("source");

-- CreateIndex
CREATE INDEX "Cleaner_externalRef_idx" ON "Cleaner"("externalRef");

-- CreateIndex
CREATE INDEX "Cleaner_isVisibleOnSchedule_idx" ON "Cleaner"("isVisibleOnSchedule");

-- CreateIndex
CREATE INDEX "Cleaner_isArchived_idx" ON "Cleaner"("isArchived");

-- CreateIndex
CREATE UNIQUE INDEX "Company_supabaseUserId_key" ON "Company"("supabaseUserId");

-- CreateIndex
CREATE INDEX "Company_plan_idx" ON "Company"("plan");

-- CreateIndex
CREATE INDEX "Company_status_idx" ON "Company"("status");

-- CreateIndex
CREATE INDEX "Company_email_idx" ON "Company"("email");

-- CreateIndex
CREATE INDEX "Customer_companyId_idx" ON "Customer"("companyId");

-- CreateIndex
CREATE INDEX "Customer_workspaceId_idx" ON "Customer"("workspaceId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE INDEX "Customer_leadSource_idx" ON "Customer"("leadSource");

-- CreateIndex
CREATE INDEX "Customer_source_idx" ON "Customer"("source");

-- CreateIndex
CREATE INDEX "Customer_externalRef_idx" ON "Customer"("externalRef");

-- CreateIndex
CREATE INDEX "Customer_isActive_idx" ON "Customer"("isActive");

-- CreateIndex
CREATE INDEX "Customer_isArchived_idx" ON "Customer"("isArchived");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_workspaceId_idx" ON "Job"("workspaceId");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_cleanerId_idx" ON "Job"("cleanerId");

-- CreateIndex
CREATE INDEX "Job_serviceDate_idx" ON "Job"("serviceDate");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_orderNo_idx" ON "Job"("orderNo");

-- CreateIndex
CREATE INDEX "Job_source_idx" ON "Job"("source");

-- CreateIndex
CREATE INDEX "Job_externalRef_idx" ON "Job"("externalRef");

-- CreateIndex
CREATE INDEX "Job_invoiceNumber_idx" ON "Job"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Job_paymentStatus_idx" ON "Job"("paymentStatus");

-- CreateIndex
CREATE INDEX "Job_isArchived_idx" ON "Job"("isArchived");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_defaultWorkspaceId_fkey" FOREIGN KEY ("defaultWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cleaner" ADD CONSTRAINT "Cleaner_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cleaner" ADD CONSTRAINT "Cleaner_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cleaner" ADD CONSTRAINT "Cleaner_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailability" ADD CONSTRAINT "CleanerAvailability_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceSettings" ADD CONSTRAINT "WorkspaceSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceBusinessHour" ADD CONSTRAINT "WorkspaceBusinessHour_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceBusinessHour" ADD CONSTRAINT "WorkspaceBusinessHour_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTaxProfile" ADD CONSTRAINT "WorkspaceTaxProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceTaxProfile" ADD CONSTRAINT "WorkspaceTaxProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
