import type { CheckCategory, CheckStatus, DocType } from "@/lib/types";
import { Rng, fake } from "./random";

interface Outcome {
  detail: string;
  evidence: string;
}

export interface CheckTemplate {
  code: string;
  label: string;
  category: CheckCategory;
  source: string;
  /** Risk contribution when this check does not pass (0–10). */
  weight: number;
  /** Only eligible when at least one of these document types was uploaded. */
  requires?: DocType[];
  /** Eligible only when *every* listed type is present (cross-document checks). */
  requiresAll?: DocType[];
  /** Relative odds of [pass, warn, fail]. */
  odds: [number, number, number];
  build: (r: Rng, status: CheckStatus) => Outcome;
}

const money = (r: Rng, min: number, max: number) =>
  Math.round(r.float(min, max, 0) / 100) * 100;

export const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export const CHECKS: CheckTemplate[] = [
  {
    code: "VND-01",
    label: "Vendor exists in master registry",
    category: "Identity",
    source: "Vendor Master · MCA21",
    weight: 9,
    odds: [82, 10, 8],
    build: (r, s) => {
      const cin = `U${r.chars("0123456789", 5)}MH${r.int(2009, 2023)}PTC${r.chars("0123456789", 6)}`;
      if (s === "pass")
        return {
          detail: `Counterparty matched to an active registered entity with a continuous filing history since ${r.int(2009, 2020)}.`,
          evidence: `CIN ${cin} · status ACTIVE`,
        };
      if (s === "warn")
        return {
          detail: `Entity is registered but has not filed annual returns for ${r.int(2, 3)} consecutive years. Legal standing is uncertain.`,
          evidence: `CIN ${cin} · last filing FY${r.int(21, 23)}`,
        };
      return {
        detail: `No active registration found for the counterparty named on the document. The nearest match was struck off the register.`,
        evidence: `CIN ${cin} · status STRUCK OFF`,
      };
    },
  },
  {
    code: "GST-01",
    label: "GST number valid and active",
    category: "Tax",
    source: "GSTN Public Search",
    weight: 8,
    requires: ["Invoice", "GST Return", "Purchase Order", "Tax Form"],
    odds: [78, 14, 8],
    build: (r, s) => {
      const g = fake.gstin(r);
      if (s === "pass")
        return {
          detail: `GSTIN checksum verified and registration confirmed active with regular filing status.`,
          evidence: `${g} · ACTIVE`,
        };
      if (s === "warn")
        return {
          detail: `GSTIN is valid but the registered trade name differs from the name printed on the document.`,
          evidence: `${g} · name mismatch`,
        };
      return {
        detail: `GSTIN failed the modulo-36 checksum. This identifier cannot have been issued by GSTN.`,
        evidence: `${g} · INVALID CHECKSUM`,
      };
    },
  },
  {
    code: "GST-02",
    label: "Supplier has filed GSTR-1 for the period",
    category: "Tax",
    source: "GSTR-2B reconciliation",
    weight: 7,
    requires: ["Invoice", "GST Return"],
    odds: [64, 24, 12],
    build: (r, s) => {
      const period = `${r.pick(["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"])} 2025`;
      if (s === "pass")
        return {
          detail: `Invoice appears in GSTR-2B for the matching tax period. Input tax credit is safe to claim.`,
          evidence: `Period ${period} · matched`,
        };
      if (s === "warn")
        return {
          detail: `Invoice is missing from GSTR-2B for ${period}. It may still appear in the next filing cycle.`,
          evidence: `Period ${period} · not yet reported`,
        };
      return {
        detail: `Supplier has not filed GSTR-1 for ${r.int(2, 4)} periods. Input tax credit claimed against this invoice is at risk of reversal under Rule 37A.`,
        evidence: `Period ${period} · no filing`,
      };
    },
  },
  {
    code: "INV-01",
    label: "Invoice number unique across ledger",
    category: "Ledger",
    source: "Accounts payable ledger",
    weight: 8,
    requires: ["Invoice"],
    odds: [80, 9, 11],
    build: (r, s) => {
      const no = fake.invoiceNo(r);
      if (s === "pass")
        return {
          detail: `No prior submission found with this invoice number from this counterparty.`,
          evidence: `${no} · 1 occurrence`,
        };
      if (s === "warn")
        return {
          detail: `A near-identical invoice number was submitted ${r.int(9, 90)} days ago for a different amount. Likely a revision, worth confirming.`,
          evidence: `${no} · 2 near matches`,
        };
      return {
        detail: `Exact duplicate. This invoice number was already paid on ${fake.date(r)}. Re-payment would be a duplicate disbursement.`,
        evidence: `${no} · already settled`,
      };
    },
  },
  {
    code: "PO-01",
    label: "Amount matches purchase order",
    category: "Financial",
    source: "3-way match",
    weight: 9,
    requiresAll: ["Invoice", "Purchase Order"],
    odds: [58, 30, 12],
    build: (r, s) => {
      const po = money(r, 180000, 2400000);
      if (s === "pass")
        return {
          detail: `Invoice total reconciles to the purchase order and the goods receipt note within tolerance.`,
          evidence: `PO ${inr(po)} · INV ${inr(po)} · Δ 0%`,
        };
      const delta = r.float(2.5, 9.5, 1);
      const invoiced = Math.round(po * (1 + delta / 100));
      if (s === "warn")
        return {
          detail: `Invoice exceeds the approved purchase order by ${delta}%. This is above the ${r.pick(["1%", "2%"])} tolerance and needs a written variance approval.`,
          evidence: `PO ${inr(po)} · INV ${inr(invoiced)} · Δ +${delta}%`,
        };
      const bigDelta = r.float(18, 62, 1);
      return {
        detail: `Invoice exceeds the purchase order by ${bigDelta}%, with no approved change order on file. Do not release payment on the current authorisation.`,
        evidence: `PO ${inr(po)} · INV ${inr(Math.round(po * (1 + bigDelta / 100)))} · Δ +${bigDelta}%`,
      };
    },
  },
  {
    code: "PO-02",
    label: "Quantities reconcile to goods receipt",
    category: "Financial",
    source: "3-way match",
    weight: 6,
    requiresAll: ["Invoice", "Purchase Order"],
    odds: [70, 22, 8],
    build: (r, s) => {
      const ordered = r.int(40, 900);
      if (s === "pass")
        return {
          detail: `Every line item billed was received and signed for at the delivery point.`,
          evidence: `${ordered} ordered · ${ordered} received`,
        };
      const short = r.int(2, 18);
      if (s === "warn")
        return {
          detail: `Billed quantity exceeds the goods receipt on ${r.int(1, 2)} line item(s). Short delivery may not have been credited.`,
          evidence: `${ordered} billed · ${ordered - short} received`,
        };
      return {
        detail: `${r.int(2, 4)} billed line items have no corresponding goods receipt at all. There is no evidence these goods were ever delivered.`,
        evidence: `${ordered} billed · ${ordered - r.int(60, 240)} received`,
      };
    },
  },
  {
    code: "PAY-01",
    label: "Matching payment found in bank statement",
    category: "Ledger",
    source: "Bank statement parse",
    weight: 7,
    requires: ["Bank Statement", "Invoice"],
    odds: [62, 26, 12],
    build: (r, s) => {
      const amt = money(r, 90000, 1800000);
      if (s === "pass")
        return {
          detail: `A single outbound transfer matches the invoice value and the beneficiary account on record.`,
          evidence: `${fake.utr(r)} · ${inr(amt)}`,
        };
      if (s === "warn")
        return {
          detail: `Payment found, but split across ${r.int(2, 4)} transfers over ${r.int(6, 40)} days. Structured payments below the reporting threshold warrant a look.`,
          evidence: `${r.int(2, 4)} transfers · ${inr(amt)} total`,
        };
      return {
        detail: `No settlement found against this invoice in the statement period, yet it is marked paid in the ledger. The funds trail is broken.`,
        evidence: `0 matches · expected ${inr(amt)}`,
      };
    },
  },
  {
    code: "PAY-02",
    label: "Beneficiary account unchanged",
    category: "Identity",
    source: "Payee change monitor",
    weight: 10,
    requires: ["Bank Statement", "Invoice"],
    odds: [84, 8, 8],
    build: (r, s) => {
      const acc = `XXXX${r.chars("0123456789", 4)}`;
      if (s === "pass")
        return {
          detail: `Beneficiary bank details are identical to the last ${r.int(4, 20)} settled invoices from this vendor.`,
          evidence: `A/C ${acc} · unchanged`,
        };
      if (s === "warn")
        return {
          detail: `Beneficiary IFSC changed since the previous invoice, though the account holder name still matches.`,
          evidence: `A/C ${acc} · IFSC changed`,
        };
      return {
        detail: `Bank account changed ${r.int(1, 9)} days before this invoice was raised, and the new account is held at a different bank. This is the signature pattern of vendor-impersonation fraud.`,
        evidence: `A/C ${acc} · changed ${r.int(1, 9)}d ago`,
      };
    },
  },
  {
    code: "TAX-01",
    label: "Tax calculation correct",
    category: "Tax",
    source: "Recomputation",
    weight: 5,
    requires: ["Invoice", "GST Return", "Tax Form"],
    odds: [76, 18, 6],
    build: (r, s) => {
      const base = money(r, 100000, 1400000);
      const rate = r.pick([5, 12, 18, 28]);
      const correct = Math.round((base * rate) / 100);
      if (s === "pass")
        return {
          detail: `CGST/SGST split recomputed from line items and matches the printed total to the rupee.`,
          evidence: `${rate}% on ${inr(base)} = ${inr(correct)}`,
        };
      if (s === "warn")
        return {
          detail: `Tax total is off by ${inr(r.int(40, 900))} against recomputation — consistent with a rounding rule difference rather than an error.`,
          evidence: `${rate}% on ${inr(base)} · minor variance`,
        };
      return {
        detail: `Applied rate of ${r.pick([5, 12])}% does not match the ${rate}% slab for the declared HSN code. The undercharge is ${inr(Math.round(correct * 0.4))}.`,
        evidence: `HSN ${fake.hsn(r)} · expected ${rate}%`,
      };
    },
  },
  {
    code: "TAX-02",
    label: "TDS deducted at the correct section rate",
    category: "Tax",
    source: "Section 194 rules",
    weight: 5,
    requires: ["Invoice", "Tax Form", "Salary Slip"],
    odds: [72, 22, 6],
    build: (r, s) => {
      const section = r.pick(["194C", "194J", "194Q", "194H"]);
      if (s === "pass")
        return {
          detail: `TDS withheld under ${section} at the statutory rate and the PAN is linked, so no higher-rate provision applies.`,
          evidence: `${section} · PAN ${fake.pan(r)}`,
        };
      if (s === "warn")
        return {
          detail: `No TDS was withheld. This is correct only if the vendor holds a lower-deduction certificate, which is not attached.`,
          evidence: `${section} · certificate absent`,
        };
      return {
        detail: `TDS deducted at ${r.int(1, 2)}% where ${section} requires ${r.int(5, 10)}%. Short deduction creates a disallowance exposure under section 40(a)(ia).`,
        evidence: `${section} · short deduction`,
      };
    },
  },
  {
    code: "DOC-01",
    label: "Authorised signature present",
    category: "Document",
    source: "Layout analysis",
    weight: 4,
    odds: [66, 28, 6],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Signature block detected in the expected region with an accompanying designation line.`,
          evidence: `Detected · page ${r.int(1, 2)}`,
        };
      if (s === "warn")
        return {
          detail: `No signature block found. The document carries a "computer generated, no signature required" note, which is acceptable but weakens the audit trail.`,
          evidence: `Absent · disclaimer present`,
        };
      return {
        detail: `The signature is a pasted raster image reused byte-for-byte from an earlier document in this case file.`,
        evidence: `Duplicate image hash`,
      };
    },
  },
  {
    code: "DOC-02",
    label: "No post-issue modification detected",
    category: "Document",
    source: "Metadata forensics",
    weight: 8,
    odds: [76, 14, 10],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Document metadata shows a single creation event with no incremental save history.`,
          evidence: `1 revision · producer consistent`,
        };
      if (s === "warn")
        return {
          detail: `File was re-saved ${r.int(1, 3)} times after creation. Common when scanning, but the edit window overlaps the approval date.`,
          evidence: `${r.int(2, 4)} revisions`,
        };
      return {
        detail: `The amount field sits on a separate content layer added ${r.int(3, 40)} days after the document was created. The total was altered after issue.`,
        evidence: `Layered edit · amount field`,
      };
    },
  },
  {
    code: "DOC-03",
    label: "Invoice date within the reporting period",
    category: "Document",
    source: "Period control",
    weight: 4,
    odds: [80, 17, 3],
    build: (r, s) => {
      const d = fake.date(r);
      if (s === "pass")
        return {
          detail: `Document date falls inside the open accounting period and precedes the payment date.`,
          evidence: `${d} · period open`,
        };
      if (s === "warn")
        return {
          detail: `Document is dated ${r.int(35, 120)} days before submission. Late submission may push the input credit claim past the statutory window.`,
          evidence: `${d} · late submission`,
        };
      return {
        detail: `Document is dated after the payment it supports. The paperwork was created to justify a disbursement that had already happened.`,
        evidence: `${d} · post-dated`,
      };
    },
  },
  {
    code: "BNK-01",
    label: "Statement continuity intact",
    category: "Ledger",
    source: "Balance walk-forward",
    weight: 7,
    requires: ["Bank Statement"],
    odds: [70, 20, 10],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Closing balance walks forward correctly across every page. No missing or reordered rows.`,
          evidence: `${r.int(3, 22)} pages · continuous`,
        };
      if (s === "warn")
        return {
          detail: `Page ${r.int(2, 9)} is missing from the submitted range, so ${r.int(1, 4)} days are unverified.`,
          evidence: `Gap · ${r.int(1, 4)} days`,
        };
      return {
        detail: `Running balance does not reconcile: ${inr(money(r, 40000, 700000))} of debits are unaccounted for between pages.`,
        evidence: `Balance break · ${r.int(2, 6)} rows`,
      };
    },
  },
  {
    code: "BNK-02",
    label: "No round-sum or threshold-adjacent transfers",
    category: "Financial",
    source: "Pattern detection",
    weight: 6,
    requires: ["Bank Statement"],
    odds: [68, 24, 8],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Transfer amounts show a natural distribution. No clustering below reporting thresholds.`,
          evidence: `${r.int(20, 180)} transfers reviewed`,
        };
      if (s === "warn")
        return {
          detail: `${r.int(3, 8)} transfers are exact round sums to the same beneficiary in one week.`,
          evidence: `${r.int(3, 8)} round-sum debits`,
        };
      return {
        detail: `${r.int(6, 14)} transfers sit just under the ₹2,00,000 cash-reporting threshold, spread across ${r.int(3, 9)} days to the same account.`,
        evidence: `Structuring pattern`,
      };
    },
  },
  {
    code: "SAL-01",
    label: "Payroll matches employee master",
    category: "Financial",
    source: "HRMS reconciliation",
    weight: 7,
    requires: ["Salary Slip"],
    odds: [72, 20, 8],
    build: (r, s) => {
      const n = r.int(18, 340);
      if (s === "pass")
        return {
          detail: `Every payslip maps to an active employee record with matching PF and UAN identifiers.`,
          evidence: `${n}/${n} matched`,
        };
      if (s === "warn")
        return {
          detail: `${r.int(1, 3)} payslips reference employees whose exit date precedes this pay cycle.`,
          evidence: `${n - r.int(1, 3)}/${n} matched`,
        };
      return {
        detail: `${r.int(2, 6)} payslips have no employee master record and share a single bank account. This is a ghost-employee pattern.`,
        evidence: `Shared A/C · ${r.int(2, 6)} payees`,
      };
    },
  },
  {
    code: "SAL-02",
    label: "Statutory deductions computed correctly",
    category: "Tax",
    source: "PF / ESI schedule",
    weight: 4,
    requires: ["Salary Slip"],
    odds: [78, 18, 4],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `PF at 12% and ESI contributions recompute exactly against the declared gross.`,
          evidence: `PF 12% · ESI 0.75%`,
        };
      if (s === "warn")
        return {
          detail: `PF is computed on basic pay only while ${r.int(2, 5)} allowances appear to qualify as wages under the 2019 ruling.`,
          evidence: `Base excludes ${r.int(2, 5)} components`,
        };
      return {
        detail: `Employer PF contribution is understated by ${inr(money(r, 20000, 300000))} across the cycle.`,
        evidence: `Understated contribution`,
      };
    },
  },
  {
    code: "VND-02",
    label: "No sanctions or debarment match",
    category: "Identity",
    source: "Watchlist screening",
    weight: 10,
    odds: [90, 6, 4],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Counterparty and its directors cleared screening against sanctions, debarment and adverse-media lists.`,
          evidence: `${r.int(4, 9)} lists · 0 hits`,
        };
      if (s === "warn")
        return {
          detail: `A fuzzy name match surfaced at ${r.int(72, 86)}% similarity. Different jurisdiction, so most likely a false positive.`,
          evidence: `1 partial hit · ${r.int(72, 86)}%`,
        };
      return {
        detail: `A director of the counterparty appears on a procurement debarment list with an active restriction period.`,
        evidence: `Debarment · active`,
      };
    },
  },
  {
    code: "VND-03",
    label: "No shared identity with other vendors",
    category: "Identity",
    source: "Entity graph",
    weight: 9,
    odds: [80, 12, 8],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Registered address, phone and bank account are unique to this counterparty across the vendor master.`,
          evidence: `0 shared attributes`,
        };
      if (s === "warn")
        return {
          detail: `Shares a registered address with ${r.int(2, 4)} other vendors. Consistent with a shared office, but worth confirming independence.`,
          evidence: `${r.int(2, 4)} address matches`,
        };
      return {
        detail: `Shares a bank account and a director with ${r.int(2, 3)} other active vendors, all onboarded within ${r.int(10, 60)} days of each other.`,
        evidence: `Shell cluster · ${r.int(2, 3)} entities`,
      };
    },
  },
  {
    code: "PRC-01",
    label: "Unit pricing within market band",
    category: "Financial",
    source: "Historical price index",
    weight: 5,
    requires: ["Invoice", "Purchase Order"],
    odds: [74, 22, 4],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `Unit rates sit inside the trailing twelve-month band for comparable purchases.`,
          evidence: `Δ ${r.float(-3, 3, 1)}% vs median`,
        };
      if (s === "warn")
        return {
          detail: `Unit rate is ${r.float(11, 24, 1)}% above the twelve-month median for this category with no stated justification.`,
          evidence: `Δ +${r.float(11, 24, 1)}% vs median`,
        };
      return {
        detail: `Unit rate is ${r.float(40, 120, 1)}% above every comparable purchase in the last two years.`,
        evidence: `Δ +${r.float(40, 120, 1)}% vs median`,
      };
    },
  },
  {
    code: "APR-01",
    label: "Approval chain complete",
    category: "Document",
    source: "Workflow audit",
    weight: 6,
    odds: [70, 24, 6],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `All required approvals captured in sequence and each approver was within their delegated limit.`,
          evidence: `${r.int(2, 4)}/${r.int(2, 4)} approvals`,
        };
      if (s === "warn")
        return {
          detail: `Approved after the payment date. The control operated, but out of order.`,
          evidence: `Retrospective approval`,
        };
      return {
        detail: `The value exceeds the approver's delegated authority by ${inr(money(r, 200000, 1600000))} and no second approval exists.`,
        evidence: `Limit breach`,
      };
    },
  },
  {
    code: "DUP-01",
    label: "No near-duplicate documents in scope",
    category: "Ledger",
    source: "Similarity index",
    weight: 6,
    odds: [82, 12, 6],
    build: (r, s) => {
      if (s === "pass")
        return {
          detail: `No other document in the last ${r.int(90, 400)} days exceeds the similarity threshold.`,
          evidence: `Max similarity ${r.int(11, 44)}%`,
        };
      if (s === "warn")
        return {
          detail: `A document at ${r.int(88, 95)}% similarity was submitted by a different vendor for the same period.`,
          evidence: `${r.int(88, 95)}% similar`,
        };
      return {
        detail: `Byte-identical to a document already processed under case ${fake.ref(r)}, with only the invoice number changed.`,
        evidence: `${r.int(97, 99)}% similar`,
      };
    },
  },
];
