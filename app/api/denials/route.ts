import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createDenial, listDenials } from "@/lib/services/denials";
import { denialSchema } from "@/lib/validators/denial";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const denials = await listDenials(context.supabase);
    return NextResponse.json({ data: denials }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load denials.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = denialSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid denial payload.", parsed.error);
  }

  try {
    const denial = await createDenial(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: denial }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to log denial.");
  }
}
