import type { DocType } from "@/lib/types";
import { Rng, fake } from "./random";

/**
 * Pure helpers that run on both sides of the wire. Kept out of `engine.ts` so
 * the browser bundle never has to pull in the full check catalog.
 */

/** Infer a document type from the file name. Deliberately simple — no OCR. */
export function inferDocType(fileName: string): DocType {
  const n = fileName.toLowerCase();
  const rules: [RegExp, DocType][] = [
    [/gstr|gst.?return|gst_/, "GST Return"],
    [/purchase.?order|\bpo[-_ ]|\bpo\d/, "Purchase Order"],
    [/bank|stmt|statement|passbook|ledger/, "Bank Statement"],
    [/salary|payslip|pay.?slip|payroll|wage/, "Salary Slip"],
    [/form.?16|itr|tds|tax|26as/, "Tax Form"],
    [/invoice|\binv\b|bill|receipt/, "Invoice"],
  ];
  for (const [re, type] of rules) if (re.test(n)) return type;
  return "Supporting Document";
}

/** Stable pseudo-hash of a file's identity. Not cryptographic — a display value. */
export function fingerprintOf(name: string, size: number): string {
  return fake.fingerprint(new Rng(`${name}:${size}`));
}

export function makeReference(seed: string): string {
  return fake.ref(new Rng(seed));
}
