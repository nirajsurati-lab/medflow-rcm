import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createAuthorization, listAuthorizations } from "@/lib/services/authorizations";
import { authorizationSchema } from "@/lib/validators/authorization";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const authorizations = await listAuthorizations(context.supabase, context.profile);
    return NextResponse.json({ data: authorizations }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load prior authorizations.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = authorizationSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid authorization payload.", parsed.error);
  }

  try {
    const authorization = await createAuthorization(
      context.supabase,
      context.profile,
      parsed.data
    );

    return NextResponse.json({ data: authorization }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create prior authorization.");
  }
}
