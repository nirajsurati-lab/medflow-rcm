import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createFeeSchedule, listFeeSchedules } from "@/lib/services/contracts";
import { feeScheduleSchema } from "@/lib/validators/contract";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const feeSchedules = await listFeeSchedules(context.supabase, context.profile);
    return NextResponse.json({ data: feeSchedules }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load fee schedules.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = feeScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid fee schedule payload.", parsed.error);
  }

  try {
    const feeSchedule = await createFeeSchedule(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: feeSchedule }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create fee schedule.");
  }
}
