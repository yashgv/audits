/** The visible stages of a run. Shared by the timeline UI and the report. */
export const PHASES = [
  { key: "ingest", label: "Ingesting documents", hint: "Normalising and fingerprinting" },
  { key: "extract", label: "Extracting entities", hint: "Amounts, identifiers, dates" },
  { key: "registry", label: "Cross-checking registries", hint: "GSTN · MCA21 · watchlists" },
  { key: "ledger", label: "Reconciling ledger", hint: "3-way match and settlement trail" },
  { key: "forensics", label: "Running document forensics", hint: "Layer and metadata analysis" },
  { key: "score", label: "Scoring risk", hint: "Weighting findings by exposure" },
] as const;
