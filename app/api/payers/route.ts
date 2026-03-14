import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createPayer } from "@/lib/services/lookups";
import { payerSchema } from "@/lib/validators/payer";

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = payerSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid payer payload.", parsed.error);
  }

  try {
    const payer = await createPayer(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: payer }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create payer.");
  }
}
