import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

type ParsedArgs = {
  email?: string;
  password?: string;
  role: "admin" | "biller";
  firstName?: string;
  lastName?: string;
  orgId: string;
};

const DEFAULT_ORG_ID = "99f807fc-707e-408a-8303-47016a67d667";
const { loadEnvConfig } = nextEnv;

function printUsage() {
  console.log(`
Usage:
  npm run create:admin-user -- --email admin@medflowpro.com --password 'ChangeMe123!'

Optional flags:
  --role admin|biller        Defaults to admin
  --first-name Ava
  --last-name Biller
  --org-id UUID              Defaults to ${DEFAULT_ORG_ID}

Required env vars in .env.local:
  NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    role: "admin",
    orgId: DEFAULT_ORG_ID,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (!current.startsWith("--")) {
      continue;
    }

    switch (current) {
      case "--email":
        args.email = next;
        index += 1;
        break;
      case "--password":
        args.password = next;
        index += 1;
        break;
      case "--role":
        if (next === "admin" || next === "biller") {
          args.role = next;
        }
        index += 1;
        break;
      case "--first-name":
        args.firstName = next;
        index += 1;
        break;
      case "--last-name":
        args.lastName = next;
        index += 1;
        break;
      case "--org-id":
        args.orgId = next ?? DEFAULT_ORG_ID;
        index += 1;
        break;
      case "--help":
        printUsage();
        process.exit(0);
      default:
        break;
    }
  }

  return args;
}

async function main() {
  loadEnvConfig(process.cwd());

  const { email, firstName, lastName, orgId, password, role } = parseArgs(
    process.argv.slice(2)
  );

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
    process.exit(1);
  }

  if (!email || !password) {
    console.error("Both --email and --password are required.");
    printUsage();
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle();

  if (organizationError) {
    console.error("Failed to verify the organization:", organizationError.message);
    process.exit(1);
  }

  if (!organization) {
    console.error(
      `No organization found for org_id ${orgId}. Create the organization row first before creating auth users.`
    );
    process.exit(1);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      org_id: orgId,
      role,
    },
    user_metadata: {
      first_name: firstName ?? null,
      last_name: lastName ?? null,
    },
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    console.error(
      "Common causes: missing organization row, trigger/setup mismatch, or the email already exists."
    );
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: data.user.id,
      org_id: orgId,
      email,
      role,
      first_name: firstName ?? null,
      last_name: lastName ?? null,
    },
    {
      onConflict: "id",
    }
  );

  if (profileError) {
    console.error("Auth user was created, but profile sync failed:", profileError.message);
    process.exit(1);
  }

  console.log("User created successfully.");
  console.log(`User ID: ${data.user.id}`);
  console.log(`Email: ${data.user.email}`);
  console.log(`Role: ${role}`);
  console.log(`Org ID: ${orgId}`);
  console.log(`Organization: ${organization.name}`);
}

void main();
