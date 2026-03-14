import { NextRequest, NextResponse } from "next/server";

import { signUpOrganizationAdmin } from "@/lib/auth/signup-service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

export async function POST(request: NextRequest) {
  if (!getSupabaseConfigStatus().isConfigured) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const result = await signUpOrganizationAdmin(body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(
    {
      success: true,
      workspace: {
        email: result.email,
        organizationName: result.organizationName,
      },
    },
    { status: 201 }
  );
}
