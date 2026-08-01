export type CheckStatus = "pass" | "warn" | "fail";

export type RiskLevel = "low" | "elevated" | "high" | "critical";

export type InvestigationStatus = "QUEUED" | "RUNNING" | "COMPLETED";

export const DOC_TYPES = [
  "Invoice",
  "GST Return",
  "Purchase Order",
  "Bank Statement",
  "Salary Slip",
  "Tax Form",
  "Supporting Document",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export type CheckCategory =
  | "Identity"
  | "Tax"
  | "Financial"
  | "Document"
  | "Ledger";

export interface Finding {
  id: string;
  code: string;
  label: string;
  category: CheckCategory;
  status: CheckStatus;
  detail: string;
  /** The value the engine says it compared against — makes the finding auditable. */
  evidence: string;
  /** 0–10. How much this contributes to the risk score when it is not a pass. */
  weight: number;
  source: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  priority: "immediate" | "before-payment" | "routine";
}

export interface InvestigationResult {
  version: 1;
  seed: string;
  summary: string;
  findings: Finding[];
  actions: RecommendedAction[];
  confidence: number;
  riskScore: number;
  riskLevel: RiskLevel;
  metrics: {
    checksRun: number;
    passed: number;
    warnings: number;
    failures: number;
    documentsAnalyzed: number;
    exposure: number;
    currency: string;
    processingMs: number;
  };
  ledger: { label: string; value: string; mono?: boolean }[];
}

export interface DocumentInput {
  name: string;
  size: number;
  mimeType: string;
  docType: DocType;
  fingerprint: string;
}

export interface DocumentRecord extends DocumentInput {
  id: string;
  createdAt: string;
}

export interface InvestigationRecord {
  id: string;
  reference: string;
  title: string;
  subject: string | null;
  notes: string | null;
  status: InvestigationStatus;
  riskScore: number | null;
  confidence: number | null;
  riskLevel: RiskLevel | null;
  result: InvestigationResult | null;
  documents: DocumentRecord[];
  createdAt: string;
  completedAt: string | null;
}

export interface SessionUser {
  id: string;
  authId: string;
  email: string;
  name: string | null;
  org: string | null;
}

export interface DashboardStats {
  total: number;
  completed: number;
  flagged: number;
  avgRisk: number;
  avgConfidence: number;
  exposure: number;
  hoursSaved: number;
}
