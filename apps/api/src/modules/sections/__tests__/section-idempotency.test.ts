import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../../../../generated/client/index.js";

const mockDb = {
  sectionCreationRequest: {
    findUnique: vi.fn(),
  },
  section: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("../../../db.js", () => ({ db: mockDb }));

const { createSectionIdempotent } = await import("../repository.js");

function fakeSectionRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "section-1",
    cvId: "cv-1",
    type: "LANGUAGES",
    displayName: null,
    sortOrder: 1024,
    hidden: false,
    forcePageBreak: false,
    organizeChronologically: false,
    deletable: true,
    settings: {},
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("createSectionIdempotent", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replays the original section when the (cvId, clientRequestId) ledger entry already exists", async () => {
    const section = fakeSectionRow();
    mockDb.sectionCreationRequest.findUnique.mockResolvedValue({
      id: "req-1",
      cvId: "cv-1",
      clientRequestId: "client-req-1",
      sectionId: "section-1",
      createdAt: new Date(),
    });
    mockDb.section.findUnique.mockResolvedValue(section);

    const result = await createSectionIdempotent("cv-1", {
      type: "languages",
      displayName: undefined,
      clientRequestId: "client-req-1",
    });

    expect(result.id).toBe("section-1");
    // Never opened a transaction — no new section was created.
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("stays correct under a concurrent race: the loser reads back the winner's section instead of duplicating it", async () => {
    // First check (before the transaction): no ledger row yet — both
    // "concurrent" requests observe this.
    mockDb.sectionCreationRequest.findUnique
      .mockResolvedValueOnce(undefined) // this request's pre-check
      // After losing the transaction race, it re-reads the ledger and this
      // time finds the row the *other* request committed first.
      .mockResolvedValueOnce({
        id: "req-1",
        cvId: "cv-1",
        clientRequestId: "client-req-race",
        sectionId: "winning-section",
        createdAt: new Date(),
      });

    // Simulate this request losing the unique-constraint race inside the
    // transaction (another request's SectionCreationRequest insert won).
    mockDb.$transaction.mockImplementation(async () => {
      throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      });
    });

    const winningSection = fakeSectionRow({ id: "winning-section" });
    mockDb.section.findUnique.mockResolvedValue(winningSection);

    const result = await createSectionIdempotent("cv-1", {
      type: "languages",
      displayName: undefined,
      clientRequestId: "client-req-race",
    });

    // No duplicate was created — the loser transparently returns the
    // winner's section instead of propagating the constraint error.
    expect(result.id).toBe("winning-section");
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1);
  });

  it("re-throws unexpected errors instead of silently swallowing them", async () => {
    mockDb.sectionCreationRequest.findUnique.mockResolvedValueOnce(undefined);
    mockDb.$transaction.mockImplementation(async () => {
      throw new Error("database is on fire");
    });

    await expect(
      createSectionIdempotent("cv-1", {
        type: "languages",
        displayName: undefined,
        clientRequestId: "client-req-2",
      }),
    ).rejects.toThrow("database is on fire");
  });
});
