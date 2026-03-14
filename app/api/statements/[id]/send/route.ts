import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse } from "@/lib/http/api-errors";
import { markStatementSent } from "@/lib/services/statements";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(_: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  try {
    const { id } = await context.params;
    const statement = await markStatementSent(authContext.supabase, authContext.profile, id);
    return NextResponse.json({ data: statement }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to send the statement.");
  }
}
