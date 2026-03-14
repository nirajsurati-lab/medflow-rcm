import { NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse } from "@/lib/http/api-errors";
import { listCollections } from "@/lib/services/collections";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const claims = await listCollections(context.supabase, context.profile);
    return NextResponse.json({ data: claims }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load collections.");
  }
}
