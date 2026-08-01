import type { DocType } from "@/lib/types";

interface DemoCase {
  title: string;
  subject: string;
  notes: string;
  hoursAgo: number;
  files: { name: string; size: number; docType: DocType }[];
}

/** Seed cases for an empty workspace, so the dashboard has something to say. */
export const DEMO_CASES: DemoCase[] = [
  {
    title: "Q3 vendor payout — Meridian Supplies",
    subject: "Meridian Supplies Pvt Ltd",
    notes: "Flagged by AP during the quarterly payment run. Value above the ₹5L threshold.",
    hoursAgo: 3,
    files: [
      { name: "invoice_TX-2645.pdf", size: 284_112, docType: "Invoice" },
      { name: "PO-448120.pdf", size: 141_908, docType: "Purchase Order" },
      { name: "bank_statement_sep.pdf", size: 612_440, docType: "Bank Statement" },
    ],
  },
  {
    title: "GST input credit reconciliation — August",
    subject: "Kaveri Industrial Traders",
    notes: "Routine GSTR-2B match ahead of the monthly return.",
    hoursAgo: 27,
    files: [
      { name: "gstr1_august_2025.pdf", size: 398_220, docType: "GST Return" },
      { name: "invoice_bill_9921.pdf", size: 205_774, docType: "Invoice" },
      { name: "form_26as_extract.pdf", size: 176_330, docType: "Tax Form" },
    ],
  },
  {
    title: "Contractor payroll review — Site 4",
    subject: "Ashwin Facility Services",
    notes: "Headcount grew 30% in one cycle with no new site contract.",
    hoursAgo: 76,
    files: [
      { name: "payslip_batch_sept.pdf", size: 731_004, docType: "Salary Slip" },
      { name: "bank_stmt_payroll_acc.pdf", size: 522_889, docType: "Bank Statement" },
    ],
  },
];
