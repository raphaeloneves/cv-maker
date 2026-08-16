-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'ACTIVE', 'CANCELED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "BuilderLocale" AS ENUM ('PT_PT', 'EN');

-- CreateEnum
CREATE TYPE "CvContentLanguage" AS ENUM ('PT_PT', 'EN');

-- CreateEnum
CREATE TYPE "TemplateId" AS ENUM ('HELSINKI', 'LISBON', 'KYOTO', 'DENVER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'NON_BINARY', 'SELF_DESCRIBED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('PROFILE_SUMMARY', 'WORK_EXPERIENCE', 'EDUCATION', 'SKILLS', 'HOBBIES', 'REFERENCES', 'LANGUAGES', 'COURSES', 'ACHIEVEMENTS', 'PUBLICATIONS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DateGranularity" AS ENUM ('FULL', 'YEAR_ONLY', 'HIDDEN');

-- CreateEnum
CREATE TYPE "LanguageScale" AS ENUM ('DESCRIPTIVE', 'CEFR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "locale" "BuilderLocale" NOT NULL DEFAULT 'PT_PT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terms_acceptances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "terms_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cvs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled CV',
    "contentLanguage" "CvContentLanguage" NOT NULL DEFAULT 'PT_PT',
    "templateId" "TemplateId" NOT NULL DEFAULT 'HELSINKI',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_template_preferences" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "templateId" "TemplateId" NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "cv_template_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personal_info" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "postalCode" TEXT,
    "city" TEXT,
    "dobDay" INTEGER,
    "dobMonth" INTEGER,
    "dobYear" INTEGER,
    "placeOfBirth" TEXT,
    "drivingLicence" TEXT,
    "gender" "Gender",
    "genderSelfDescribed" TEXT,
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "linkedin" TEXT,
    "website" TEXT,
    "photoUrl" TEXT,
    "photoZoom" DOUBLE PRECISION,
    "photoRotationDeg" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personal_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "displayName" TEXT,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "forcePageBreak" BOOLEAN NOT NULL DEFAULT false,
    "organizeChronologically" BOOLEAN NOT NULL DEFAULT false,
    "deletable" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "freeformDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_creation_requests" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "clientRequestId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_creation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_experience_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "city" TEXT,
    "startGranularity" "DateGranularity" NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER NOT NULL,
    "endIsPresent" BOOLEAN NOT NULL,
    "endGranularity" "DateGranularity",
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "description" TEXT,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_experience_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "education_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "city" TEXT,
    "startGranularity" "DateGranularity" NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER NOT NULL,
    "endIsPresent" BOOLEAN NOT NULL,
    "endGranularity" "DateGranularity",
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "description" TEXT,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "credentialUrl" TEXT,
    "city" TEXT,
    "startGranularity" "DateGranularity" NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER NOT NULL,
    "endIsPresent" BOOLEAN NOT NULL,
    "endGranularity" "DateGranularity",
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "description" TEXT,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,
    "scale" "LanguageScale" NOT NULL,
    "level" TEXT NOT NULL,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hobby_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hobby_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_entries" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "sortOrder" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "cv_template_preferences_cvId_templateId_key" ON "cv_template_preferences"("cvId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "personal_info_cvId_key" ON "personal_info"("cvId");

-- CreateIndex
CREATE INDEX "sections_cvId_idx" ON "sections"("cvId");

-- CreateIndex
CREATE UNIQUE INDEX "section_creation_requests_cvId_clientRequestId_key" ON "section_creation_requests"("cvId", "clientRequestId");

-- CreateIndex
CREATE INDEX "work_experience_entries_sectionId_idx" ON "work_experience_entries"("sectionId");

-- CreateIndex
CREATE INDEX "education_entries_sectionId_idx" ON "education_entries"("sectionId");

-- CreateIndex
CREATE INDEX "course_entries_sectionId_idx" ON "course_entries"("sectionId");

-- CreateIndex
CREATE INDEX "skill_entries_sectionId_idx" ON "skill_entries"("sectionId");

-- CreateIndex
CREATE INDEX "language_entries_sectionId_idx" ON "language_entries"("sectionId");

-- CreateIndex
CREATE INDEX "hobby_entries_sectionId_idx" ON "hobby_entries"("sectionId");

-- CreateIndex
CREATE INDEX "reference_entries_sectionId_idx" ON "reference_entries"("sectionId");

-- AddForeignKey
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_template_preferences" ADD CONSTRAINT "cv_template_preferences_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personal_info" ADD CONSTRAINT "personal_info_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_experience_entries" ADD CONSTRAINT "work_experience_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_entries" ADD CONSTRAINT "education_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_entries" ADD CONSTRAINT "course_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_entries" ADD CONSTRAINT "skill_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "language_entries" ADD CONSTRAINT "language_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hobby_entries" ADD CONSTRAINT "hobby_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_entries" ADD CONSTRAINT "reference_entries_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
