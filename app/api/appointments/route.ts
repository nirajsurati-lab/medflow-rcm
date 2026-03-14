import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createAppointment, listAppointments } from "@/lib/services/appointments";
import { appointmentSchema } from "@/lib/validators/appointment";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const appointments = await listAppointments(context.supabase, context.profile);
    return NextResponse.json({ data: appointments }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load appointments.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid appointment payload.", parsed.error);
  }

  try {
    const appointment = await createAppointment(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create appointment.");
  }
}
