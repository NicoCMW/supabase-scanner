import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  AB_COOKIE_NAME,
  AB_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/ab-testing/experiments";
import {
  parseAssignments,
  serializeAssignments,
  assignMissingExperiments,
} from "@/lib/ab-testing/cookies";

function applyAbCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const existing = request.cookies.get(AB_COOKIE_NAME)?.value ?? "";
  const parsed = existing ? parseAssignments(existing) : {};
  const assignments = assignMissingExperiments(parsed);
  const serialized = serializeAssignments(assignments);

  if (serialized !== existing) {
    response.cookies.set(AB_COOKIE_NAME, serialized, {
      path: "/",
      maxAge: AB_COOKIE_MAX_AGE_SECONDS,
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return applyAbCookie(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
