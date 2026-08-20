import type { AcademyLessonContent, AcademyLessonSummary, AcademyOutline, UserRole } from "@cv-maker/contracts";
import { hasActiveEntitlement } from "@cv-maker/contracts";
import { forbidden, notFound } from "../../errors.js";
import { findSubscriptionByUserId, subscriptionToDomain } from "../billing/repository.js";
import * as content from "./content.js";
import * as repo from "./repository.js";

/** Same shape as cv-optimizer/service.ts's own `requireEntitled` — duplicated
 * rather than shared, matching that module's own choice not to factor this
 * out across modules. */
async function isEntitled(userId: string, role: UserRole): Promise<boolean> {
  const row = await findSubscriptionByUserId(userId);
  const subscription = row ? subscriptionToDomain(row) : null;
  return hasActiveEntitlement(subscription, role);
}

function toSummary(
  lesson: content.AcademyLessonDefinition,
  completedSlugs: Set<string>,
  entitled: boolean,
): AcademyLessonSummary {
  return {
    slug: lesson.slug,
    title: lesson.title,
    isFree: lesson.isFree,
    locked: !lesson.isFree && !entitled,
    completed: completedSlugs.has(lesson.slug),
  };
}

export async function getOutline(userId: string, role: UserRole): Promise<AcademyOutline> {
  const [completedSlugs, entitled] = await Promise.all([
    repo.listCompletedSlugs(userId),
    isEntitled(userId, role),
  ]);

  return {
    standaloneLessons: content.ACADEMY_STANDALONE_LESSONS.map((lesson) =>
      toSummary(lesson, completedSlugs, entitled),
    ),
    groups: content.ACADEMY_GROUPS.map((group) => ({
      slug: group.slug,
      title: group.title,
      lessons: group.lessons.map((lesson) => toSummary(lesson, completedSlugs, entitled)),
    })),
  };
}

/** Throws 404 for an unknown slug, 403 if it's Pro-only and the caller isn't
 * entitled — same "can't read it, can't complete it" gate `markComplete`
 * below reuses. */
async function requireReadableLesson(
  slug: string,
  userId: string,
  role: UserRole,
): Promise<content.AcademyLessonDefinition> {
  const lesson = content.findLessonDefinition(slug);
  if (!lesson) throw notFound("Lesson not found.");
  if (!lesson.isFree && !(await isEntitled(userId, role))) {
    throw forbidden("This lesson is part of Academy's Pro content. Upgrade to unlock it.");
  }
  return lesson;
}

export async function getLessonContent(
  slug: string,
  userId: string,
  role: UserRole,
): Promise<AcademyLessonContent> {
  const lesson = await requireReadableLesson(slug, userId, role);
  const completedSlugs = await repo.listCompletedSlugs(userId);
  return {
    slug: lesson.slug,
    title: lesson.title,
    isFree: lesson.isFree,
    locked: false,
    completed: completedSlugs.has(lesson.slug),
    body: lesson.body,
  };
}

export async function markComplete(slug: string, userId: string, role: UserRole): Promise<void> {
  await requireReadableLesson(slug, userId, role);
  await repo.markLessonComplete(userId, slug);
}
