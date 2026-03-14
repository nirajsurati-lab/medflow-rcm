import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { signupSchema } from "@/lib/validators/auth";

type SignupFailure = {
  ok: false;
  error: string;
  status: 400 | 409 | 500;
};

type SignupSuccess = {
  ok: true;
  email: string;
  organizationName: string;
};

export type SignupResult = SignupFailure | SignupSuccess;

function getSignupErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("already") ||
    normalizedMessage.includes("exists") ||
    normalizedMessage.includes("registered")
  ) {
    return {
      error: "An account with that email already exists. Sign in instead.",
      status: 409 as const,
    };
  }

  return {
    error: "Unable to create your MedFlow Pro workspace right now.",
    status: 500 as const,
  };
}

export async function signUpOrganizationAdmin(
  input: unknown
): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    return {
      ok: false,
      error: issue?.message ?? "Enter valid signup details.",
      status: 400,
    };
  }

  const adminSupabase = createAdminSupabaseClient();

  if (!adminSupabase) {
    return {
      ok: false,
      error:
        "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local before using signup.",
      status: 500,
    };
  }

  const { organization_name, first_name, last_name, email, password } = parsed.data;

  const { data: organization, error: organizationError } = await adminSupabase
    .from("organizations")
    .insert({
      name: organization_name,
      plan_tier: "starter",
    })
    .select("id, name")
    .single();

  if (organizationError || !organization) {
    return {
      ok: false,
      error: "Unable to create the organization workspace.",
      status: 500,
    };
  }

  const { data: createdUser, error: createUserError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        org_id: organization.id,
        role: "admin",
      },
      user_metadata: {
        first_name,
        last_name,
      },
    });

  if (createUserError || !createdUser.user) {
    await adminSupabase.from("organizations").delete().eq("id", organization.id);

    const mappedError = getSignupErrorMessage(
      createUserError?.message ?? "Unable to create auth user."
    );

    return {
      ok: false,
      error: mappedError.error,
      status: mappedError.status,
    };
  }

  const { error: profileError } = await adminSupabase.from("users").upsert(
    {
      id: createdUser.user.id,
      org_id: organization.id,
      email,
      role: "admin",
      first_name,
      last_name,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(createdUser.user.id);
    await adminSupabase.from("organizations").delete().eq("id", organization.id);

    return {
      ok: false,
      error: "Your auth account was created, but staff provisioning failed.",
      status: 500,
    };
  }

  return {
    ok: true,
    email,
    organizationName: organization.name,
  };
}
