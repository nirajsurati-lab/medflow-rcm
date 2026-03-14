import { NextRequest, NextResponse } from "next/server";

import { signUpOrganizationAdmin } from "@/lib/auth/signup-service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

function formDataToObject(formData: FormData | null) {
  if (!formData) {
    return null;
  }

  return {
    organization_name: formData.get("organization_name"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  };
}

function buildSignupRedirect(request: NextRequest, error: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/signup";
  url.search = new URLSearchParams({ error }).toString();
  return url;
}

function buildLoginRedirect(
  request: NextRequest,
  success: string
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = new URLSearchParams({ success }).toString();
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

    return NextResponse.redirect(buildSignupRedirect(request, error));
  }

  const body = isJsonRequest
    ? await request.json().catch(() => null)
    : formDataToObject(await request.formData().catch(() => null));
  const result = await signUpOrganizationAdmin(body);

  if (!result.ok) {
    if (isJsonRequest) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.redirect(buildSignupRedirect(request, result.error));
  }

  if (!isJsonRequest) {
    return NextResponse.redirect(
      buildLoginRedirect(
        request,
        `Workspace created for ${result.organizationName}. Sign in with ${result.email} to continue.`
      )
    );
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
