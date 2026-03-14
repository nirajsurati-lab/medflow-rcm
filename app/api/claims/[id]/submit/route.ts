import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse } from "@/lib/http/api-errors";
import { submitClaim } from "@/lib/services/claims";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json(
      { error: authContext.error },
      { status: authContext.status }
    );
  }

  try {
    const { id } = await context.params;
    const claim = await submitClaim(
      authContext.supabase,
      authContext.profile,
      id
    );
    return NextResponse.json({ data: claim }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to submit claim.");
  }
}
