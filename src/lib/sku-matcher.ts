import type { Product } from "@/db/schema";

const VIESSMANN_FAMILIES = [
  "vitodens",
  "vitocal",
  "vitocell",
  "vitosol",
  "vitoclima",
  "vitoconnect",
  "vitotron",
  "vitotrol",
  "vitosolic",
  "vitovent",
  "vitovolt",
  "vitoladens",
  "vitorondens",
  "vitocrossal",
];

export function isLikelyViessmann(description: string): boolean {
  const lower = description.toLowerCase();
  return VIESSMANN_FAMILIES.some((f) => lower.includes(f));
}

export function detectFamily(description: string): string | null {
  const lower = description.toLowerCase();
  for (const f of VIESSMANN_FAMILIES) {
    if (lower.includes(f)) return f;
  }
  return null;
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenise(s: string): string[] {
  return normalise(s).split(/[\s,/.\-()]+/).filter((t) => t.length > 1);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface MatchResult {
  product: Product | null;
  confidence: number; // 0..100
  kind: "exact" | "normalized" | "fuzzy" | "family" | "none";
  isViessmann: boolean;
}

export function matchLine(rawDescription: string, kpdSifra: string | null, products: Product[]): MatchResult {
  const desc = rawDescription || "";
  const isVie = isLikelyViessmann(desc);
  if (!isVie) {
    return { product: null, confidence: 0, kind: "none", isViessmann: false };
  }

  const family = detectFamily(desc);

  // Try exact KPD code match within Viessmann
  if (kpdSifra) {
    const kpdMatches = products.filter((p) => p.isViessmann && p.kpdSifra === kpdSifra);
    if (kpdMatches.length === 1) {
      return { product: kpdMatches[0], confidence: 95, kind: "exact", isViessmann: true };
    }
  }

  const descLower = normalise(desc);
  const descTokens = new Set(tokenise(desc));

  // Exact-substring on model name
  for (const p of products) {
    if (!p.isViessmann) continue;
    const model = normalise(p.model);
    if (model && descLower.includes(model)) {
      return { product: p, confidence: 90, kind: "normalized", isViessmann: true };
    }
  }

  // Token Jaccard on description
  let best: { p: Product; score: number } | null = null;
  for (const p of products) {
    if (!p.isViessmann) continue;
    if (family && p.family.toLowerCase() !== family) continue;
    const candidateTokens = new Set(tokenise(`${p.family} ${p.model} ${p.description}`));
    const score = jaccard(descTokens, candidateTokens);
    if (!best || score > best.score) best = { p, score };
  }

  if (best && best.score >= 0.35) {
    return { product: best.p, confidence: Math.round(best.score * 100), kind: "fuzzy", isViessmann: true };
  }

  // We know it's Viessmann but couldn't pin a specific product — still count it (family-level)
  return { product: null, confidence: 50, kind: "family", isViessmann: true };
}
