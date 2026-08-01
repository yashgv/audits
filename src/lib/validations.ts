import { z } from "zod";
import { DOC_TYPES } from "@/lib/types";

export const credentialsSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Use at least 6 characters")
    .max(72, "Password is too long"),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;

export const documentSchema = z.object({
  name: z.string().min(1).max(200),
  size: z.number().int().nonnegative().max(50 * 1024 * 1024, "Files are capped at 50 MB"),
  mimeType: z.string().max(120),
  docType: z.enum(DOC_TYPES),
  fingerprint: z.string().max(120),
});

export const createInvestigationSchema = z.object({
  title: z
    .string()
    .min(3, "Give the case a name of at least 3 characters")
    .max(90, "Keep the case name under 90 characters"),
  subject: z.string().max(90, "Keep this under 90 characters").optional().or(z.literal("")),
  notes: z.string().max(600, "Keep notes under 600 characters").optional().or(z.literal("")),
  documents: z
    .array(documentSchema)
    .min(1, "Add at least one document")
    .max(12, "A case takes up to 12 documents"),
});

export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;

export const profileSchema = z.object({
  name: z.string().max(80).optional().or(z.literal("")),
  org: z.string().max(80).optional().or(z.literal("")),
});
