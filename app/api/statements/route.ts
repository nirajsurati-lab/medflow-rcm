import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse } from "@/lib/http/api-errors";
import { listStatements } from "@/lib/services/statements";

export async function GET(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const statements = await listStatements(
      context.supabase,
      context.profile,
      request.nextUrl.origin
    );

    return NextResponse.json({ data: statements }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load statements.");
  }
}
