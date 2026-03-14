import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { listCredentialing, upsertCredentialing } from "@/lib/services/credentialing";
import { credentialingSchema } from "@/lib/validators/credentialing";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const records = await listCredentialing(context.supabase, context.profile);
    return NextResponse.json({ data: records }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load credentialing.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = credentialingSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid credentialing payload.", parsed.error);
  }

  try {
    const record = await upsertCredentialing(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to save credentialing.");
  }
}
