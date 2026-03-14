import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createProvider } from "@/lib/services/lookups";
import { providerSchema } from "@/lib/validators/provider";

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = providerSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid provider payload.", parsed.error);
  }

  try {
    const provider = await createProvider(
      context.supabase,
      context.profile,
      parsed.data
    );
    return NextResponse.json({ data: provider }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create provider.");
  }
}
