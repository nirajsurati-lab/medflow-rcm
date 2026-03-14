import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type UserLookup = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "email" | "first_name" | "last_name"
>;

export type AuditLogSummary = AuditLogRow & {
  actor_name: string;
  changed_fields: string[];
  summary: string;
};

function isRecord(value: Json | null): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getChangedFields(oldData: Json | null, newData: Json | null) {
  const oldRecord = isRecord(oldData) ? oldData : null;
  const newRecord = isRecord(newData) ? newData : null;

  if (!isRecord(oldData) && !isRecord(newData)) {
    return [];
  }

  if (!oldRecord && newRecord) {
    return Object.keys(newRecord);
  }

  if (oldRecord && !newRecord) {
    return Object.keys(oldRecord);
  }

  const allKeys = new Set([
    ...Object.keys(oldRecord ?? {}),
    ...Object.keys(newRecord ?? {}),
  ]);

  return [...allKeys].filter((key) => oldRecord?.[key] !== newRecord?.[key]);
}

function formatActorName(user: UserLookup | undefined) {
  if (!user) {
    return "System";
  }

  const name = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  if (name) {
    return `${name} (${user.email})`;
  }

  return user.email;
}

function buildSummary(log: AuditLogRow, changedFields: string[]) {
  if (log.action === "INSERT") {
    return `Created ${log.table_name} record.`;
  }

  if (log.action === "DELETE") {
    return `Deleted ${log.table_name} record.`;
  }

  if (changedFields.length === 0) {
    return `Updated ${log.table_name} record.`;
  }

  return `Updated ${changedFields.slice(0, 4).join(", ")}${
    changedFields.length > 4 ? "..." : ""
  }.`;
}

export async function listAuditLogs(
  supabase: SupabaseClient<Database>,
  profile: UserProfile,
  limit = 50
) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const auditLogs = (data ?? []) as AuditLogRow[];
  const userIds = [
    ...new Set(
      auditLogs
        .map((log) => log.user_id)
        .filter((value): value is string => Boolean(value))
    ),
  ];

  let usersById = new Map<string, UserLookup>();

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name")
      .eq("org_id", profile.org_id)
      .in("id", userIds);

    if (usersError) {
      throw new Error(usersError.message);
    }

    usersById = new Map(
      ((users ?? []) as UserLookup[]).map((user) => [user.id, user])
    );
  }

  return auditLogs.map((log) => {
    const changedFields = getChangedFields(log.old_data, log.new_data);

    return {
      ...log,
      actor_name: log.user_id ? formatActorName(usersById.get(log.user_id)) : "System",
      changed_fields: changedFields,
      summary: buildSummary(log, changedFields),
    };
  });
}
