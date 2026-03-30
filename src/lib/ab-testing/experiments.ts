export type Variant = {
  readonly id: string;
  readonly weight: number;
};

export type Experiment = {
  readonly id: string;
  readonly variants: readonly Variant[];
};

export const EXPERIMENTS = {
  hero_headline: {
    id: "hero_headline",
    variants: [
      { id: "security", weight: 1 },
      { id: "speed", weight: 1 },
      { id: "compliance", weight: 1 },
    ],
  },
  cta_text: {
    id: "cta_text",
    variants: [
      { id: "scan_now_free", weight: 1 },
      { id: "check_security", weight: 1 },
      { id: "get_score", weight: 1 },
    ],
  },
  social_proof_placement: {
    id: "social_proof_placement",
    variants: [
      { id: "above_fold", weight: 1 },
      { id: "below_scanner", weight: 1 },
      { id: "sidebar", weight: 1 },
    ],
  },
} as const satisfies Record<string, Experiment>;

export type ExperimentId = keyof typeof EXPERIMENTS;

export type VariantId<E extends ExperimentId> =
  (typeof EXPERIMENTS)[E]["variants"][number]["id"];

export const ACTIVE_EXPERIMENTS: readonly ExperimentId[] = [
  "hero_headline",
  "cta_text",
  "social_proof_placement",
];

export const AB_COOKIE_NAME = "ab_experiments";
export const AB_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
