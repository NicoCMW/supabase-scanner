import { cookies } from "next/headers";
import {
  AB_COOKIE_NAME,
  EXPERIMENTS,
  type ExperimentId,
  type VariantId,
} from "./experiments";
import { parseAssignments } from "./cookies";

export async function getVariant<E extends ExperimentId>(
  experimentId: E,
): Promise<VariantId<E>> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AB_COOKIE_NAME);
  if (!cookie) {
    return EXPERIMENTS[experimentId].variants[0].id as VariantId<E>;
  }

  const assignments = parseAssignments(cookie.value);
  const variant = assignments[experimentId];
  if (!variant) {
    return EXPERIMENTS[experimentId].variants[0].id as VariantId<E>;
  }

  return variant as VariantId<E>;
}

export async function getAllVariants(): Promise<
  Readonly<Record<string, string>>
> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AB_COOKIE_NAME);
  if (!cookie) return {};
  return parseAssignments(cookie.value);
}
