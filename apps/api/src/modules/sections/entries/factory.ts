import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodType } from "zod";

/** A zod schema that also exposes `.partial()` (true of every real
 * `Upsert*EntrySchema` in packages/contracts — each is a `ZodObject` built
 * via `.omit()`/`.pick()`) — narrower than `ZodType` alone so PATCH can
 * validate a partial payload with the same schema object used for POST. */
type PartialCapableZodType<T> = ZodType<T> & { partial(): ZodType<Partial<T>> };
import { notFound } from "../../../errors.js";
import { requireAuth } from "../../../plugins/auth.js";
import { getOwnedSection } from "../section-access.js";

export const ENTRY_SORT_GAP = 1024;

/** The subset of a Prisma model delegate's API the generic entry engine
 * needs. Every `*Entry` model in schema.prisma implements this shape, so one
 * factory below drives all 7 structured section-entry sub-resources
 * (work-experience/education/courses/skills/languages/hobbies/references)
 * instead of hand-writing 7 near-identical CRUD modules — mirrors the shared
 * `TimelineEntryBase` contracts pattern on the data layer. */
export interface EntryDelegate {
  findMany(args: { where: { sectionId: string }; orderBy: { sortOrder: "asc" } }): Promise<
    Record<string, unknown>[]
  >;
  findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
  create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
  delete(args: { where: { id: string } }): Promise<Record<string, unknown>>;
  aggregate(args: {
    where: { sectionId: string };
    _max: { sortOrder: true };
  }): Promise<{ _max: { sortOrder: number | null } }>;
}

export interface EntryKindConfig<TDomain, TUpsert> {
  /** URL segment, e.g. "work-experience" — see docs/api-routes.md. */
  urlSegment: string;
  upsertSchema: PartialCapableZodType<TUpsert>;
  delegate: EntryDelegate;
  toDomain: (row: Record<string, unknown>) => TDomain;
  /** Maps a validated (full or partial) upsert payload onto the
   * entry-specific Prisma create/update columns (excluding
   * id/sectionId/sortOrder/timestamps, which the engine itself manages).
   * Must only emit keys actually present in `input` so PATCH with a subset
   * of fields never clobbers the rest. */
  toWriteData: (input: Partial<TUpsert>) => Record<string, unknown>;
}

const reorderSchema = z.object({ orderedEntryIds: z.array(z.string().uuid()).min(1) });

async function assertEntryInSection(
  delegate: EntryDelegate,
  sectionId: string,
  entryId: string,
): Promise<void> {
  const row = await delegate.findUnique({ where: { id: entryId } });
  if (!row || row.sectionId !== sectionId) {
    throw notFound("Entry not found");
  }
}

/** Registers the standard 5-route shape (list/create/update/delete/reorder)
 * for one structured entry kind. Called once per kind in `./index.ts`. */
export function registerEntryRoutes<TDomain, TUpsert>(
  app: FastifyInstance,
  config: EntryKindConfig<TDomain, TUpsert>,
): void {
  const collectionPath = `/sections/:sectionId/${config.urlSegment}`;
  const memberPath = `${collectionPath}/:entryId`;
  const { delegate } = config;

  app.get(collectionPath, { preHandler: requireAuth }, async (req) => {
    const { sectionId } = req.params as { sectionId: string };
    await getOwnedSection(sectionId, req.user!.id);
    const rows = await delegate.findMany({ where: { sectionId }, orderBy: { sortOrder: "asc" } });
    return rows.map(config.toDomain);
  });

  app.post(collectionPath, { preHandler: requireAuth }, async (req, reply) => {
    const { sectionId } = req.params as { sectionId: string };
    await getOwnedSection(sectionId, req.user!.id);
    const input = config.upsertSchema.parse(req.body);
    const agg = await delegate.aggregate({ where: { sectionId }, _max: { sortOrder: true } });
    const sortOrder = (agg._max.sortOrder ?? 0) + ENTRY_SORT_GAP;
    const row = await delegate.create({
      data: { sectionId, sortOrder, ...config.toWriteData(input) },
    });
    reply.code(201);
    return config.toDomain(row);
  });

  app.patch(memberPath, { preHandler: requireAuth }, async (req) => {
    const { sectionId, entryId } = req.params as { sectionId: string; entryId: string };
    await getOwnedSection(sectionId, req.user!.id);
    await assertEntryInSection(delegate, sectionId, entryId);
    const input = config.upsertSchema.partial().parse(req.body);
    const row = await delegate.update({
      where: { id: entryId },
      data: config.toWriteData(input),
    });
    return config.toDomain(row);
  });

  app.delete(memberPath, { preHandler: requireAuth }, async (req, reply) => {
    const { sectionId, entryId } = req.params as { sectionId: string; entryId: string };
    await getOwnedSection(sectionId, req.user!.id);
    await assertEntryInSection(delegate, sectionId, entryId);
    await delegate.delete({ where: { id: entryId } });
    reply.code(204);
    return null;
  });

  app.post(`${collectionPath}/reorder`, { preHandler: requireAuth }, async (req) => {
    const { sectionId } = req.params as { sectionId: string };
    await getOwnedSection(sectionId, req.user!.id);
    const { orderedEntryIds } = reorderSchema.parse(req.body);
    // Each row's sortOrder update is independent (gap-based reorder, see
    // ENTRY_SORT_GAP) — Promise.all is enough; a real Prisma.$transaction
    // batch isn't reachable here since `delegate` is intentionally typed as
    // the loose, kind-agnostic `EntryDelegate` shape, not a concrete
    // PrismaPromise-returning delegate.
    await Promise.all(
      orderedEntryIds.map((id, index) =>
        delegate.update({ where: { id }, data: { sortOrder: (index + 1) * ENTRY_SORT_GAP } }),
      ),
    );
    const rows = await delegate.findMany({ where: { sectionId }, orderBy: { sortOrder: "asc" } });
    return rows.map(config.toDomain);
  });
}
