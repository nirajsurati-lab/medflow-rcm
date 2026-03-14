import { NextRequest, NextResponse } from "next/server";

import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const isJsonRequest =
    request.headers.get("content-type")?.includes("application/json") ?? false;

  if (getSupabaseConfigStatus().isConfigured) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  if (isJsonRequest) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}
