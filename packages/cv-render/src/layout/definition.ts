import { TEMPLATE_DEFINITIONS, type TemplateId, type TemplateLayout } from "@cv-maker/contracts";

/** Looks structural layout facts (columns, sidebar side, meter style, photo
 * support) up from the single curated source of truth in
 * packages/contracts/src/templates.ts, instead of re-declaring them per
 * template component — so the two can never silently drift apart. */
export function templateLayoutFor(id: TemplateId): TemplateLayout {
  const definition = TEMPLATE_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown template id: ${id}`);
  return definition.layout;
}
