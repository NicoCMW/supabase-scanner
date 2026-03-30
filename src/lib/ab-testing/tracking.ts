declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }
}

function pushEvent(event: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function trackExperimentExposure(
  experimentId: string,
  variantId: string,
): void {
  pushEvent({
    event: "experiment_exposure",
    experiment_id: experimentId,
    variant_id: variantId,
  });

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "experiment_exposure", {
      event_category: "ab_testing",
      event_label: `${experimentId}:${variantId}`,
      experiment_id: experimentId,
      variant_id: variantId,
    });
  }
}

export function trackExperimentConversion(
  experimentId: string,
  variantId: string,
  conversionType: string,
): void {
  pushEvent({
    event: "experiment_conversion",
    experiment_id: experimentId,
    variant_id: variantId,
    conversion_type: conversionType,
  });
}

export function pushAllExperimentAssignments(
  assignments: Readonly<Record<string, string>>,
): void {
  for (const [experimentId, variantId] of Object.entries(assignments)) {
    trackExperimentExposure(experimentId, variantId);
  }
}
