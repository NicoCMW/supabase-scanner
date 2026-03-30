import {
  EXPERIMENTS,
  ACTIVE_EXPERIMENTS,
  type ExperimentId,
  type Variant,
} from "./experiments";

export type Assignments = Readonly<Record<string, string>>;

export function parseAssignments(cookieValue: string): Assignments {
  const assignments: Record<string, string> = {};
  for (const pair of cookieValue.split(",")) {
    const [experimentId, variantId] = pair.split(":");
    if (experimentId && variantId) {
      assignments[experimentId] = variantId;
    }
  }
  return assignments;
}

export function serializeAssignments(assignments: Assignments): string {
  return Object.entries(assignments)
    .map(([experimentId, variantId]) => `${experimentId}:${variantId}`)
    .join(",");
}

function pickVariant(variants: readonly Variant[]): string {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant.id;
  }
  return variants[variants.length - 1].id;
}

export function assignMissingExperiments(
  existing: Assignments,
): Assignments {
  const assignments = { ...existing };
  for (const experimentId of ACTIVE_EXPERIMENTS) {
    if (!(experimentId in assignments)) {
      const experiment = EXPERIMENTS[experimentId];
      assignments[experimentId] = pickVariant(experiment.variants);
    }
  }
  return assignments;
}
