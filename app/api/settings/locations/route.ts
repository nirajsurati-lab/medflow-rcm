import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createLocation, listLocations } from "@/lib/services/locations";
import { locationSchema } from "@/lib/validators/location";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const locations = await listLocations(context.supabase, context.profile);
    return NextResponse.json({ data: locations }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load locations.");
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid location payload.", parsed.error);
  }

  try {
    const location = await createLocation(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: location }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create location.");
  }
}
