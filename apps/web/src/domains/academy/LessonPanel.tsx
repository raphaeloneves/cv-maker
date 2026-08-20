import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { BuilderLocale } from "@cv-maker/contracts";
import { Button, Card } from "@/components/ui";
import { ApiError } from "@/lib/api-client";
import { t } from "@/i18n";
import { getLesson, markLessonComplete } from "./api";
import { ACADEMY_OUTLINE_QUERY_KEY } from "./query-keys";

const MARKDOWN_COMPONENTS: Components = {
  h2: (props) => <h2 className="mt-8 font-display text-xl font-bold tracking-tight text-heading first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-6 font-display text-base font-bold text-heading" {...props} />,
  p: (props) => <p className="mt-4 text-sm leading-relaxed text-body" {...props} />,
  strong: (props) => <strong className="font-semibold text-heading" {...props} />,
  ul: (props) => <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body" {...props} />,
  ol: (props) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-body" {...props} />,
  blockquote: (props) => (
    <blockquote className="mt-4 border-l-2 border-orange/40 pl-4 text-sm italic leading-relaxed text-text-muted" {...props} />
  ),
};

function LockedPanel({ locale }: { locale: BuilderLocale }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <p className="text-sm font-medium text-heading">{t(locale, "academy.locked.note")}</p>
      <a href="/billing" className="self-start text-sm font-semibold text-orange hover:text-accent-hover">
        {t(locale, "academy.locked.cta")} →
      </a>
    </Card>
  );
}

export function LessonPanel({ slug, locale }: { slug: string; locale: BuilderLocale }) {
  const queryClient = useQueryClient();
  const lessonQuery = useQuery({
    queryKey: ["academy-lesson", slug],
    queryFn: () => getLesson(slug),
    retry: false,
  });
  const completeMutation = useMutation({
    mutationFn: () => markLessonComplete(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-lesson", slug] });
      queryClient.invalidateQueries({ queryKey: ACADEMY_OUTLINE_QUERY_KEY });
    },
  });

  if (lessonQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="mono-label text-xs text-text-muted">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  if (lessonQuery.isError) {
    if (lessonQuery.error instanceof ApiError && lessonQuery.error.status === 403) {
      return <LockedPanel locale={locale} />;
    }
    return (
      <Card className="p-6">
        <p className="text-sm text-danger">{t(locale, "academy.error")}</p>
      </Card>
    );
  }

  const lesson = lessonQuery.data;
  if (!lesson) return null;

  return (
    <article>
      <div className="flex justify-end">
        <Button
          variant={lesson.completed ? "secondary" : "primary"}
          size="sm"
          disabled={lesson.completed || completeMutation.isPending}
          onClick={() => completeMutation.mutate()}
        >
          {lesson.completed ? t(locale, "academy.completed") : t(locale, "academy.markComplete")}
        </Button>
      </div>
      <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-heading">{lesson.title}</h1>

      {lesson.body.kind === "video" ? (
        <Card className="mt-6 flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-sm font-semibold text-heading">{t(locale, "academy.video.title")}</p>
          <p className="text-sm text-text-muted">{t(locale, "academy.video.body")}</p>
        </Card>
      ) : (
        <div className="mt-2 max-w-2xl">
          <ReactMarkdown components={MARKDOWN_COMPONENTS}>{lesson.body.markdown}</ReactMarkdown>
        </div>
      )}
    </article>
  );
}
