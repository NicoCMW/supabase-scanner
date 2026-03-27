export interface Plan {
  readonly id: "free" | "pro";
  readonly name: string;
  readonly priceMonthly: number;
  readonly scansPerMonth: number;
  readonly stripePriceId: string | null;
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    scansPerMonth: 3,
    stripePriceId: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    scansPerMonth: Infinity,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
} as const;

export function getPlan(planId: string): Plan {
  return PLANS[planId] ?? PLANS.free;
}

export function isProPlan(planId: string): boolean {
  return planId === "pro";
}
