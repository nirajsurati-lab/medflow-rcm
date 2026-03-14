import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { updateLocation } from "@/lib/services/locations";
import { locationSchema } from "@/lib/validators/location";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json({ error: authContext.error }, { status: authContext.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid location payload.", parsed.error);
  }

  try {
    const { id } = await context.params;
    const location = await updateLocation(
      authContext.supabase,
      authContext.profile,
      id,
      parsed.data
    );
    return NextResponse.json({ data: location }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update location.");
  }
}
