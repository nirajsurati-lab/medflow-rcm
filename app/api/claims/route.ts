import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createClaim, listClaims } from "@/lib/services/claims";
import { claimSchema } from "@/lib/validators/claim";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const claims = await listClaims(context.supabase, context.profile);
    return NextResponse.json({ data: claims }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load claims.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid claim payload.", parsed.error);
  }

  try {
    const claim = await createClaim(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: claim }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create claim.");
  }
}
