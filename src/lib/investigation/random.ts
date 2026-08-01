/**
 * Deterministic PRNG.
 *
 * Every investigation seeds from its own id, so a case shows the *same* findings
 * on every reload (a report that changes when you refresh it is worthless), while
 * two different cases look nothing alike.
 */

function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

export class Rng {
  private state: number;

  constructor(seed: string) {
    this.state = cyrb128(seed)[0];
  }

  /** float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number, decimals = 2): number {
    const v = this.next() * (max - min) + min;
    return Number(v.toFixed(decimals));
  }

  bool(trueOdds = 0.5): boolean {
    return this.next() < trueOdds;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Weighted pick. `weights` must align with `items` and sum > 0. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  chars(set: string, length: number): string {
    let out = "";
    for (let i = 0; i < length; i++) out += set[Math.floor(this.next() * set.length)];
    return out;
  }
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const NUM = "0123456789";
const HEX = "0123456789ABCDEF";

export const fake = {
  gstin: (r: Rng) =>
    `${r.int(1, 37).toString().padStart(2, "0")}${r.chars(ALPHA, 5)}${r.chars(NUM, 4)}${r.chars(ALPHA, 1)}${r.chars(NUM, 1)}Z${r.chars(HEX, 1)}`,
  pan: (r: Rng) => `${r.chars(ALPHA, 5)}${r.chars(NUM, 4)}${r.chars(ALPHA, 1)}`,
  invoiceNo: (r: Rng) =>
    `${r.pick(["INV", "TX", "BILL", "SI"])}/${r.int(24, 26)}-${r.int(25, 27)}/${r.chars(NUM, 4)}`,
  poNo: (r: Rng) => `PO-${r.chars(NUM, 6)}`,
  utr: (r: Rng) => `UTR${r.chars(NUM, 12)}`,
  hsn: (r: Rng) => r.chars(NUM, 6),
  ref: (r: Rng) => `VRT-${r.chars(HEX, 6)}`,
  fingerprint: (r: Rng) => `sha256:${r.chars(HEX.toLowerCase(), 12)}`,
  date: (r: Rng) => {
    const d = new Date(2025, r.int(0, 11), r.int(1, 28));
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },
};
