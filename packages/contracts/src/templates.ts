import { z } from "zod";
import { templateIdSchema } from "./enums.js";
import type { TemplateId } from "./enums.js";

/** features/17-template-theme-selection.md. Templates are whole, curated
 * layout designs (not composable style tokens) — `layout` describes enough
 * structure for the shared render engine in packages/cv-render to lay a CV
 * out consistently, while the visual identity of each template still comes
 * from its own component implementation. */
export const templateLayoutSchema = z.object({
  columns: z.union([z.literal(1), z.literal(2)]),
  sidebar: z.enum(["left", "right", "none"]),
  meterStyle: z.enum(["bar", "dot", "text"]),
  photoSupported: z.boolean(),
});
export type TemplateLayout = z.infer<typeof templateLayoutSchema>;

export const templateDefinitionSchema = z.object({
  id: templateIdSchema,
  name: z.string(),
  layout: templateLayoutSchema,
  /** Small, curated, template-specific swatch set — never a shared global
   * palette (features/17). First entry is the template's default color. */
  colorPalette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3).max(6),
  /** Premium templates are visible/browsable pre-payment but export watermarked
   * without an active subscription — see features/19's freemium decision. */
  premium: z.boolean(),
  /** Drives the "Recommended" badge in the template gallery — a curated
   * editorial call for conversion, not a computed/popularity-based flag.
   * At most one or two templates should ever carry this at a time; omitted
   * (falsy) is the default for every template. */
  recommended: z.boolean().optional(),
});
export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: "helsinki",
    name: "Helsinki",
    layout: { columns: 2, sidebar: "left", meterStyle: "bar", photoSupported: true },
    colorPalette: ["#0A1628", "#1B3A6B", "#E8640C", "#243F72"],
    premium: false,
  },
  {
    id: "lisbon",
    name: "Lisbon",
    layout: { columns: 1, sidebar: "none", meterStyle: "dot", photoSupported: true },
    // First entry is the default accent — deliberately led with orange (not
    // navy) so Lisbon's default tint reads distinctly from Helsinki's at a
    // glance in the template gallery, even though both share this swatch set.
    colorPalette: ["#E8640C", "#0A1628", "#4A5568", "#1B3A6B"],
    premium: false,
  },
  {
    id: "porto",
    name: "Porto",
    // Single column, no sidebar, no photo, plain-text meters — a quiet,
    // ATS-safe, one-column layout built for a long, detailed career history:
    // every role gets full narrative treatment, nothing compressed. Listed
    // first among the premium templates — it's the gallery's curated
    // "Recommended" pick, and conversion is better when that pick is the
    // first thing a browsing, not-yet-paying visitor sees.
    layout: { columns: 1, sidebar: "none", meterStyle: "text", photoSupported: false },
    colorPalette: ["#B8500A", "#1A1F29", "#57647A", "#0A1628"],
    premium: true,
    recommended: true,
  },
  {
    id: "kyoto",
    name: "Kyoto",
    layout: { columns: 2, sidebar: "right", meterStyle: "text", photoSupported: false },
    colorPalette: ["#0A1628", "#F4A261", "#1B3A6B"],
    premium: true,
  },
  {
    id: "denver",
    name: "Denver",
    layout: { columns: 1, sidebar: "none", meterStyle: "bar", photoSupported: true },
    colorPalette: ["#1B3A6B", "#E8640C", "#0A1628", "#F4A261"],
    premium: true,
  },
  {
    id: "marrakech",
    name: "Marrakech",
    layout: { columns: 2, sidebar: "right", meterStyle: "bar", photoSupported: true },
    colorPalette: ["#B5501F", "#7A2E1D", "#E8640C", "#2B1B14"],
    premium: true,
  },
  {
    id: "geneva",
    name: "Geneva",
    layout: { columns: 2, sidebar: "left", meterStyle: "dot", photoSupported: false },
    colorPalette: ["#12403F", "#1B3A6B", "#2E6E6A", "#0A1628"],
    premium: true,
  },
  {
    id: "faro",
    name: "Faro",
    // Porto's compact companion: same quiet, text-first design language,
    // built to hold a full career on one page — the most recent role gets
    // full detail, earlier roles condense to a single line each.
    layout: { columns: 1, sidebar: "none", meterStyle: "text", photoSupported: false },
    colorPalette: ["#B8500A", "#1A1F29", "#57647A", "#0A1628"],
    premium: true,
  },
];

/** Per-template last-picked accent color — switching templates and back
 * restores the color you had, rather than one flat CV-level color field
 * (features/17's key data-model requirement). */
export const cvTemplatePreferenceSchema = z.object({
  cvId: z.string().uuid(),
  templateId: templateIdSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type CvTemplatePreference = z.infer<typeof cvTemplatePreferenceSchema>;

export function defaultColorFor(templateId: TemplateId): string {
  const def = TEMPLATE_DEFINITIONS.find((t) => t.id === templateId);
  const first = def?.colorPalette[0];
  if (!first) throw new Error(`Unknown template id: ${templateId}`);
  return first;
}
