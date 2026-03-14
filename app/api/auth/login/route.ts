import { NextRequest, NextResponse } from "next/server";

import { loginWithPassword } from "@/lib/auth/service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!getSupabaseConfigStatus().isConfigured) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);

  const supabase = await createServerSupabaseClient();
  const result = await loginWithPassword(supabase, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
      },
    },
    { status: 200 }
  );
}
