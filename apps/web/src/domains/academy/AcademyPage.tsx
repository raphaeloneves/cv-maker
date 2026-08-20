import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppQueryProvider } from "@/lib/query-client";
import { RequireAuth } from "@/domains/auth/components/RequireAuth";
import { t } from "@/i18n";
import { useBuilderLocale } from "@/lib/use-builder-locale";
import { getOutline } from "./api";
import { ACADEMY_OUTLINE_QUERY_KEY } from "./query-keys";
import { useLessonSlug, setLessonSlug } from "./use-lesson-slug";
import { AcademySidebar } from "./AcademySidebar";
import { LessonPanel } from "./LessonPanel";

/** First lesson in outline order — standalone lessons first, then each
 * group's lessons in turn. Used to pick a default `?lesson=` when none is
 * set yet (first visit, or a bookmark to bare `/academy`). */
function firstLessonSlug(outline: Awaited<ReturnType<typeof getOutline>>): string | undefined {
  return outline.standaloneLessons[0]?.slug ?? outline.groups.flatMap((g) => g.lessons)[0]?.slug;
}

function AcademyBody() {
  const locale = useBuilderLocale();
  const outlineQuery = useQuery({ queryKey: ACADEMY_OUTLINE_QUERY_KEY, queryFn: getOutline });
  const slug = useLessonSlug();

  useEffect(() => {
    if (slug !== null || !outlineQuery.data) return;
    const defaultSlug = firstLessonSlug(outlineQuery.data);
    if (defaultSlug) setLessonSlug(defaultSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, outlineQuery.data]);

  if (outlineQuery.isLoading || slug === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  if (!outlineQuery.data) return null;

  // `slug` is `null` for exactly one render tick while the effect above
  // picks and pushes the default — render nothing that tick rather than a
  // panel with no lesson selected.
  const selectedSlug = slug ?? firstLessonSlug(outlineQuery.data);
  if (!selectedSlug) return null;

  return (
    <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8">
      <p className="mono-label text-xs text-orange">{t(locale, "academy.eyebrow")}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-heading">{t(locale, "academy.title")}</h1>
      <p className="mt-2 max-w-xl text-sm text-text-muted">{t(locale, "academy.subtitle")}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <div className="rounded-[5px] bg-surface-card p-4">
          <AcademySidebar outline={outlineQuery.data} selectedSlug={selectedSlug} onSelect={setLessonSlug} />
        </div>
        <div className="rounded-[5px] bg-surface-card p-6">
          <LessonPanel slug={selectedSlug} locale={locale} />
        </div>
      </div>
    </div>
  );
}

/** `/academy` — a curated slice of the founder's career-coaching classroom:
 * 2 lessons free for every account, then two Pro-only lesson groups. Unlike
 * CV Optimizer, the page itself has no whole-page entitlement gate — gating
 * is per-lesson (see LessonPanel's locked state), so any signed-in account
 * can browse the sidebar and read the free lessons. */
export function AcademyPage() {
  return (
    <AppQueryProvider>
      <RequireAuth>{() => <AcademyBody />}</RequireAuth>
    </AppQueryProvider>
  );
}
