-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('PUSH', 'PULL', 'LEGS', 'OTHERS');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('NECK', 'TRAPEZIUS_UPPER', 'TRAPEZIUS_LOWER', 'DELTOIDS_ANTERIOR', 'DELTOIDS_MEDIAL', 'DELTOIDS_POSTERIOR', 'CHEST_UPPER', 'CHEST_MIDDLE', 'CHEST_LOWER', 'LATS', 'RHOMBOIDS_UPPER', 'RHOMBOIDS_LOWER', 'TERES_MAJOR', 'TERES_MINOR', 'ERECTOR_SPINAE_UPPER', 'ERECTOR_SPINAE_LOWER', 'BICEPS_LONG_HEAD', 'BICEPS_SHORT_HEAD', 'TRICEPS_LONG_HEAD', 'TRICEPS_MEDIAL_HEAD', 'TRICEPS_LATERAL_HEAD', 'FOREARMS_FLEXORS', 'FOREARMS_EXTENSORS', 'ABS_UPPER', 'ABS_LOWER', 'OBLIQUES', 'GLUTES_MAXIMUS', 'GLUTES_MEDIAS', 'ABDUCTORS', 'ADDUCTORS', 'QUADS_VASTUS_LATERALIS', 'QUADS_VASTUS_MEDIALIS', 'QUADS_RECTUS_FEMORIS', 'HAMSTRINGS', 'CALVES_GASTROCNEMIUS', 'CALVES_SOLEUS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "secondaryMuscles" "MuscleGroup"[],
    "type" "ExerciseType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "instructions" TEXT[],
    "imageUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_exercises" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE INDEX "exercises_muscleGroup_idx" ON "exercises"("muscleGroup");

-- CreateIndex
CREATE INDEX "exercises_type_idx" ON "exercises"("type");

-- CreateIndex
CREATE INDEX "exercises_name_idx" ON "exercises"("name");

-- CreateIndex
CREATE INDEX "exercises_difficulty_idx" ON "exercises"("difficulty");

-- CreateIndex
CREATE INDEX "favorite_exercises_userId_idx" ON "favorite_exercises"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_exercises_userId_exerciseId_key" ON "favorite_exercises"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "favorite_exercises" ADD CONSTRAINT "favorite_exercises_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_exercises" ADD CONSTRAINT "favorite_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
