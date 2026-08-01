"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db";
import { runInvestigation } from "@/lib/investigation/engine";
import { fingerprintOf } from "@/lib/investigation/documents";
import { createInvestigationSchema, profileSchema } from "@/lib/validations";
import { DEMO_CASES } from "@/lib/demo-data";
import type { InvestigationRecord } from "@/lib/types";

type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

function fail(message: string): { ok: false; message: string } {
  return { ok: false, message };
}

/** Create a case and its document metadata. Files never leave the browser. */
export async function createInvestigationAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = createInvestigationSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Those details are not valid");
  }

  try {
    const created = await store.createInvestigation({
      userId: user.id,
      title: parsed.data.title.trim(),
      subject: parsed.data.subject?.trim() || null,
      notes: parsed.data.notes?.trim() || null,
      documents: parsed.data.documents,
    });
    revalidatePath("/dashboard");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    console.error("createInvestigation failed", error);
    return fail("Could not open the case. Check the database connection and retry.");
  }
}

/**
 * Runs the analysis. Idempotent: re-invoking a completed case returns the
 * stored result rather than regenerating it, so a report never changes
 * underneath the person reading it.
 */
export async function executeInvestigationAction(
  id: string,
): Promise<ActionResult<InvestigationRecord>> {
  const user = await requireUser();

  try {
    const existing = await store.getInvestigation(user.id, id);
    if (!existing) return fail("That case does not exist in your workspace");
    if (existing.status === "COMPLETED" && existing.result) {
      return { ok: true, data: existing };
    }

    const result = runInvestigation(
      `${existing.id}:${existing.reference}`,
      existing.documents,
      existing.subject,
    );
    const completed = await store.completeInvestigation(user.id, id, result);
    if (!completed) return fail("That case could not be updated");

    revalidatePath("/dashboard");
    revalidatePath(`/investigations/${id}`);
    return { ok: true, data: completed };
  } catch (error) {
    console.error("executeInvestigation failed", error);
    return fail("The analysis could not complete. Try running it again.");
  }
}

export async function deleteInvestigationAction(id: string): Promise<ActionResult<null>> {
  const user = await requireUser();
  try {
    await store.deleteInvestigation(user.id, id);
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (error) {
    console.error("deleteInvestigation failed", error);
    return fail("Could not archive that case");
  }
}

/** Populates an empty workspace with three finished cases so the demo has depth. */
export async function seedDemoCasesAction(): Promise<ActionResult<null>> {
  const user = await requireUser();
  try {
    const existing = await store.listInvestigations(user.id);
    if (existing.length > 0) return fail("Workspace already has cases");

    const now = Date.now();
    for (let i = 0; i < DEMO_CASES.length; i++) {
      const template = DEMO_CASES[i];
      const createdAt = new Date(now - template.hoursAgo * 3600_000);
      const created = await store.createInvestigation({
        userId: user.id,
        title: template.title,
        subject: template.subject,
        notes: template.notes,
        createdAt,
        documents: template.files.map((f) => ({
          name: f.name,
          size: f.size,
          mimeType: "application/pdf",
          docType: f.docType,
          fingerprint: fingerprintOf(f.name, f.size),
        })),
      });
      const result = runInvestigation(
        `${created.id}:${created.reference}`,
        created.documents,
        template.subject,
      );
      await store.completeInvestigation(
        user.id,
        created.id,
        result,
        new Date(createdAt.getTime() + 60_000),
      );
    }

    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (error) {
    console.error("seedDemoCases failed", error);
    return fail("Could not generate the demo cases");
  }
}

export async function updateProfileAction(input: unknown): Promise<ActionResult<null>> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details");

  try {
    await store.updateUser(user.id, {
      name: parsed.data.name?.trim() || null,
      org: parsed.data.org?.trim() || null,
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { ok: true, data: null };
  } catch (error) {
    console.error("updateProfile failed", error);
    return fail("Could not save those details");
  }
}
