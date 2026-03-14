import { NextRequest, NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { syncStatementPaymentFromSession } from "@/lib/services/statements";

type RouteContext = {
  params: Promise<{
    statementId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const supabase = createAdminSupabaseClient();
  const { statementId } = await context.params;
  const token = request.nextUrl.searchParams.get("token");
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const redirectUrl = new URL(`/pay/${statementId}`, request.nextUrl.origin);

  if (token) {
    redirectUrl.searchParams.set("token", token);
  }

  if (!supabase || !sessionId) {
    redirectUrl.searchParams.set("status", "error");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    await syncStatementPaymentFromSession(supabase, sessionId);
    redirectUrl.searchParams.set("status", "paid");
    return NextResponse.redirect(redirectUrl);
  } catch {
    redirectUrl.searchParams.set("status", "error");
    return NextResponse.redirect(redirectUrl);
  }
}
