"use server";

import { redirect } from "next/navigation";

import { signUpOrganizationAdmin } from "@/lib/auth/signup-service";
import { getSupabaseConfigStatus } from "@/lib/supabase/config";

function buildSignupRedirect(error: string) {
  const searchParams = new URLSearchParams({ error });
  return `/signup?${searchParams.toString()}`;
}

function buildLoginRedirect(success: string) {
  const searchParams = new URLSearchParams({ success });
  return `/login?${searchParams.toString()}`;
}

export async function signupAction(formData: FormData) {
  if (!getSupabaseConfigStatus().isConfigured) {
    redirect(
      buildSignupRedirect(
        "Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first."
      )
    );
  }

  const result = await signUpOrganizationAdmin({
    organization_name: formData.get("organization_name"),
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!result.ok) {
    redirect(buildSignupRedirect(result.error));
  }

  redirect(
    buildLoginRedirect(
      `Workspace created for ${result.organizationName}. Sign in with ${result.email} to continue.`
    )
  );
}
