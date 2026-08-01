import { hasDatabase } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { makeReference } from "@/lib/investigation/documents";
import type {
  DashboardStats,
  DocumentInput,
  DocumentRecord,
  InvestigationRecord,
  InvestigationResult,
  InvestigationStatus,
  RiskLevel,
  SessionUser,
} from "@/lib/types";

export interface CreateInvestigationInput {
  userId: string;
  title: string;
  subject?: string | null;
  notes?: string | null;
  documents: DocumentInput[];
  /** Backdating hook — only used when generating demo cases. */
  createdAt?: Date;
}

export interface Store {
  ensureUser(input: { authId: string; email: string; name?: string | null }): Promise<SessionUser>;
  updateUser(userId: string, patch: { name?: string | null; org?: string | null }): Promise<SessionUser>;
  listInvestigations(userId: string, query?: string): Promise<InvestigationRecord[]>;
  getInvestigation(userId: string, id: string): Promise<InvestigationRecord | null>;
  createInvestigation(input: CreateInvestigationInput): Promise<InvestigationRecord>;
  completeInvestigation(
    userId: string,
    id: string,
    result: InvestigationResult,
    at?: Date,
  ): Promise<InvestigationRecord | null>;
  deleteInvestigation(userId: string, id: string): Promise<void>;
}

const iso = (d: Date | string | null | undefined) =>
  d ? (typeof d === "string" ? d : d.toISOString()) : null;

/* ------------------------------------------------------------------ *
 * Prisma-backed store
 * ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(row: any): InvestigationRecord {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    subject: row.subject ?? null,
    notes: row.notes ?? null,
    status: row.status as InvestigationStatus,
    riskScore: row.riskScore ?? null,
    confidence: row.confidence ?? null,
    riskLevel: (row.riskLevel ?? null) as RiskLevel | null,
    result: (row.result ?? null) as InvestigationResult | null,
    documents: (row.documents ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any): DocumentRecord => ({
        id: d.id,
        name: d.name,
        size: d.size,
        mimeType: d.mimeType,
        docType: d.docType,
        fingerprint: d.fingerprint,
        createdAt: iso(d.createdAt)!,
      }),
    ),
    createdAt: iso(row.createdAt)!,
    completedAt: iso(row.completedAt),
  };
}

const prismaStore: Store = {
  async ensureUser({ authId, email, name }) {
    const db = getPrisma();
    const user = await db.user.upsert({
      where: { authId },
      update: { email },
      create: { authId, email, name: name ?? email.split("@")[0] },
    });
    return { id: user.id, authId: user.authId, email: user.email, name: user.name, org: user.org };
  },

  async updateUser(userId, patch) {
    const db = getPrisma();
    const user = await db.user.update({ where: { id: userId }, data: patch });
    return { id: user.id, authId: user.authId, email: user.email, name: user.name, org: user.org };
  },

  async listInvestigations(userId, query) {
    const db = getPrisma();
    const q = query?.trim();
    const rows = await db.investigation.findMany({
      where: {
        userId,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { subject: { contains: q, mode: "insensitive" as const } },
                { reference: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: { documents: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(toRecord);
  },

  async getInvestigation(userId, id) {
    const db = getPrisma();
    const row = await db.investigation.findFirst({
      where: { id, userId },
      include: { documents: true },
    });
    return row ? toRecord(row) : null;
  },

  async createInvestigation({ userId, title, subject, notes, documents, createdAt }) {
    const db = getPrisma();
    const row = await db.investigation.create({
      data: {
        userId,
        title,
        subject: subject ?? null,
        notes: notes ?? null,
        reference: makeReference(`${userId}:${title}:${Date.now()}:${Math.random()}`),
        documents: { create: documents },
        ...(createdAt ? { createdAt } : {}),
      },
      include: { documents: true },
    });
    return toRecord(row);
  },

  async completeInvestigation(userId, id, result, at) {
    const db = getPrisma();
    const owned = await db.investigation.findFirst({ where: { id, userId }, select: { id: true } });
    if (!owned) return null;
    const row = await db.investigation.update({
      where: { id },
      data: {
        status: "COMPLETED",
        riskScore: result.riskScore,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result: result as any,
        completedAt: at ?? new Date(),
      },
      include: { documents: true },
    });
    return toRecord(row);
  },

  async deleteInvestigation(userId, id) {
    const db = getPrisma();
    await db.investigation.deleteMany({ where: { id, userId } });
  },
};

/* ------------------------------------------------------------------ *
 * In-memory store — used when DATABASE_URL is absent.
 * Same contract, so no calling code branches on which one is active.
 * ------------------------------------------------------------------ */

interface MemoryState {
  users: Map<string, SessionUser>;
  investigations: Map<string, InvestigationRecord & { userId: string }>;
}

const globalForMemory = globalThis as unknown as { __veritasMemory?: MemoryState };

function memory(): MemoryState {
  if (!globalForMemory.__veritasMemory) {
    globalForMemory.__veritasMemory = { users: new Map(), investigations: new Map() };
  }
  return globalForMemory.__veritasMemory;
}

const rid = (p: string) =>
  `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

const memoryStore: Store = {
  async ensureUser({ authId, email, name }) {
    const state = memory();
    const existing = [...state.users.values()].find((u) => u.authId === authId);
    if (existing) return existing;
    const user: SessionUser = {
      id: rid("usr"),
      authId,
      email,
      name: name ?? email.split("@")[0],
      org: null,
    };
    state.users.set(user.id, user);
    return user;
  },

  async updateUser(userId, patch) {
    const state = memory();
    const user = state.users.get(userId);
    if (!user) throw new Error("User not found");
    const next = { ...user, ...patch };
    state.users.set(userId, next);
    return next;
  },

  async listInvestigations(userId, query) {
    const q = query?.trim().toLowerCase();
    return [...memory().investigations.values()]
      .filter((i) => i.userId === userId)
      .filter((i) =>
        !q
          ? true
          : [i.title, i.subject ?? "", i.reference].join(" ").toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ userId: _u, ...rest }) => rest);
  },

  async getInvestigation(userId, id) {
    const row = memory().investigations.get(id);
    if (!row || row.userId !== userId) return null;
    const { userId: _u, ...rest } = row;
    return rest;
  },

  async createInvestigation({ userId, title, subject, notes, documents, createdAt }) {
    const now = (createdAt ?? new Date()).toISOString();
    const id = rid("inv");
    const record: InvestigationRecord & { userId: string } = {
      userId,
      id,
      reference: makeReference(`${userId}:${title}:${id}`),
      title,
      subject: subject ?? null,
      notes: notes ?? null,
      status: "QUEUED",
      riskScore: null,
      confidence: null,
      riskLevel: null,
      result: null,
      documents: documents.map((d) => ({ ...d, id: rid("doc"), createdAt: now })),
      createdAt: now,
      completedAt: null,
    };
    memory().investigations.set(id, record);
    const { userId: _u, ...rest } = record;
    return rest;
  },

  async completeInvestigation(userId, id, result, at) {
    const state = memory();
    const row = state.investigations.get(id);
    if (!row || row.userId !== userId) return null;
    const next = {
      ...row,
      status: "COMPLETED" as const,
      riskScore: result.riskScore,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      result,
      completedAt: (at ?? new Date()).toISOString(),
    };
    state.investigations.set(id, next);
    const { userId: _u, ...rest } = next;
    return rest;
  },

  async deleteInvestigation(userId, id) {
    const state = memory();
    const row = state.investigations.get(id);
    if (row && row.userId === userId) state.investigations.delete(id);
  },
};

export const store: Store = hasDatabase ? prismaStore : memoryStore;

export const usingDatabase = hasDatabase;

export async function getStats(userId: string): Promise<DashboardStats> {
  const all = await store.listInvestigations(userId);
  const done = all.filter((i) => i.status === "COMPLETED" && i.result);
  const flagged = done.filter((i) => (i.riskScore ?? 0) >= 50).length;
  const avg = (nums: number[]) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  return {
    total: all.length,
    completed: done.length,
    flagged,
    avgRisk: avg(done.map((i) => i.riskScore ?? 0)),
    avgConfidence: avg(done.map((i) => i.confidence ?? 0)),
    exposure: done.reduce((a, i) => a + (i.result?.metrics.exposure ?? 0), 0),
    // A manual review of a document bundle averages ~40 minutes.
    hoursSaved: Math.round(done.reduce((a, i) => a + i.documents.length * 0.66, 0)),
  };
}
