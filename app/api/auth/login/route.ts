import { NextRequest, NextResponse } from "next/server";

import { loginWithPassword } from "@/lib/auth/service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formDataToObject(formData: FormData | null) {
  if (!formData) {
    return null;
  }

  return {
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

function buildLoginRedirect(request: NextRequest, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = new URLSearchParams({ error }).toString();
  return url;
}

export async function POST(request: NextRequest) {
  const isJsonRequest =
    request.headers.get("content-type")?.includes("application/json") ?? false;

  if (!getSupabaseConfigStatus().isConfigured) {
    const error = "Supabase environment variables are not configured.";

    if (isJsonRequest) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.redirect(buildLoginRedirect(request, error));
  }

  const body = isJsonRequest
    ? await request.json().catch(() => null)
    : formDataToObject(await request.formData().catch(() => null));

  const supabase = await createServerSupabaseClient();
  const result = await loginWithPassword(supabase, body);

  if (!result.ok) {
    if (isJsonRequest) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.redirect(buildLoginRedirect(request, result.error));
  }

  if (!isJsonRequest) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
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
