import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import {
  createStatementCheckoutSession,
  getPublicStatementByToken,
} from "@/lib/services/statements";
import { statementTokenSchema } from "@/lib/validators/statement";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role key is missing." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = statementTokenSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid statement token.", parsed.error);
  }

  try {
    const { id } = await context.params;
    const publicView = await getPublicStatementByToken(
      supabase,
      id,
      parsed.data.token,
      request.nextUrl.origin
    );
    const statement = await createStatementCheckoutSession(
      supabase,
      publicView.statement,
      publicView.statement.patient_name,
      request.nextUrl.origin
    );

    return NextResponse.json(
      {
        url: statement.stripe_checkout_url,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to create statement checkout.");
  }
}
