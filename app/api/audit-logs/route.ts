import { NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse } from "@/lib/http/api-errors";
import { listAuditLogs } from "@/lib/services/audit-logs";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (context.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const auditLogs = await listAuditLogs(context.supabase);
    return NextResponse.json({ data: auditLogs }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load audit logs.");
  }
}
