import { useId, useMemo } from "react";
import { EARLIEST_SELECTABLE_YEAR, isDateRangeSuspicious } from "@cv-maker/contracts";
import type { DateEnd, DateGranularity, DatePoint, DateRange } from "@cv-maker/contracts";
import { Toggle } from "@/components/ui";
import { useBuilderLocale } from "@/lib/use-builder-locale.js";
import { t } from "@/i18n/index.js";
import { WarningIcon } from "./icons.js";

const CURRENT_YEAR = new Date().getFullYear();

function yearOptions(): number[] {
  const years: number[] = [];
  for (let y = CURRENT_YEAR; y >= EARLIEST_SELECTABLE_YEAR; y--) years.push(y);
  return years;
}

function monthLabels(intlLocale: string): string[] {
  const fmt = new Intl.DateTimeFormat(intlLocale, { month: "long" });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)));
}

const selectClasses =
  "w-full rounded-md border border-[var(--border-on-light)] bg-surface-card px-2.5 py-2 text-sm text-body focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]";

interface GranularityRowProps {
  granularity: DateGranularity;
  month: number | undefined;
  year: number;
  months: string[];
  years: number[];
  locale: "pt-PT" | "en";
  onChange: (next: { granularity: DateGranularity; month?: number; year: number }) => void;
}

function GranularityRow({ granularity, month, year, months, years, locale, onChange }: GranularityRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        aria-label={t(locale, "date.granularity")}
        className={selectClasses}
        value={granularity}
        onChange={(e) => {
          const g = e.target.value as DateGranularity;
          onChange({ granularity: g, month: g === "full" ? (month ?? new Date().getMonth() + 1) : undefined, year });
        }}
      >
        <option value="full">{t(locale, "date.granularity.full")}</option>
        <option value="year_only">{t(locale, "date.granularity.yearOnly")}</option>
        <option value="hidden">{t(locale, "date.granularity.hidden")}</option>
      </select>
      {granularity === "full" && (
        <select
          aria-label={t(locale, "date.month")}
          className={selectClasses}
          value={month}
          onChange={(e) => onChange({ granularity, month: Number(e.target.value), year })}
        >
          {months.map((label, idx) => (
            <option key={label} value={idx + 1}>
              {label}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label={t(locale, "date.year")}
        className={selectClasses}
        value={year}
        onChange={(e) => onChange({ granularity, month, year: Number(e.target.value) })}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  startLabel?: string;
  endLabel?: string;
}

/** Start granularity selector (full / year_only / hidden) + a first-class
 * "Present" toggle for the end date (never a sentinel year) + a dynamic year
 * range computed from EARLIEST_SELECTABLE_YEAR to the current year. Surfaces
 * `isDateRangeSuspicious()` as a soft inline warning, never a submit
 * blocker — see packages/contracts/src/common/date.ts. */
export function DateRangePicker({ value, onChange, startLabel, endLabel }: DateRangePickerProps) {
  const locale = useBuilderLocale();
  const presentToggleId = useId();
  const intlLocale = locale === "pt-PT" ? "pt-PT" : "en-US";
  const months = useMemo(() => monthLabels(intlLocale), [intlLocale]);
  const years = useMemo(() => yearOptions(), []);
  const suspicious = isDateRangeSuspicious(value);

  function updateStart(next: { granularity: DateGranularity; month?: number; year: number }) {
    const start: DatePoint =
      next.granularity === "full"
        ? { granularity: "full", month: next.month ?? 1, year: next.year }
        : { granularity: next.granularity, year: next.year };
    onChange({ ...value, start });
  }

  function updateEnd(next: { granularity: DateGranularity; month?: number; year: number }) {
    const end: DateEnd =
      next.granularity === "full"
        ? { isPresent: false, granularity: "full", month: next.month ?? 1, year: next.year }
        : { isPresent: false, granularity: next.granularity, year: next.year };
    onChange({ ...value, end });
  }

  const now = new Date();
  const endYear = value.end.isPresent ? now.getFullYear() : value.end.year;
  const endMonth = value.end.isPresent
    ? now.getMonth() + 1
    : value.end.granularity === "full"
      ? value.end.month
      : undefined;
  const endGranularity: DateGranularity = value.end.isPresent ? "full" : value.end.granularity;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-heading">{startLabel ?? t(locale, "date.start")}</span>
        <GranularityRow
          granularity={value.start.granularity}
          month={value.start.granularity === "full" ? value.start.month : undefined}
          year={value.start.year}
          months={months}
          years={years}
          locale={locale}
          onChange={updateStart}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-heading">{endLabel ?? t(locale, "date.end")}</span>
          <Toggle
            id={presentToggleId}
            checked={value.end.isPresent}
            onChange={(checked) =>
              onChange({
                ...value,
                end: checked
                  ? { isPresent: true }
                  : { isPresent: false, granularity: "full", month: now.getMonth() + 1, year: now.getFullYear() },
              })
            }
            label={t(locale, "date.present")}
          />
        </div>
        {!value.end.isPresent && (
          <GranularityRow
            granularity={endGranularity}
            month={endMonth}
            year={endYear}
            months={months}
            years={years}
            locale={locale}
            onChange={updateEnd}
          />
        )}
      </div>
      {suspicious && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--orange-warm)] sm:col-span-2">
          <WarningIcon className="shrink-0" /> {t(locale, "date.suspiciousWarning")}
        </p>
      )}
    </div>
  );
}
