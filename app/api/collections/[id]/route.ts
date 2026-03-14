import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { updateCollectionClaim } from "@/lib/services/collections";
import { collectionUpdateSchema } from "@/lib/validators/collection";

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
  const parsed = collectionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid collection payload.", parsed.error);
  }

  try {
    const { id } = await context.params;
    const claim = await updateCollectionClaim(
      authContext.supabase,
      authContext.profile,
      id,
      parsed.data
    );
    return NextResponse.json({ data: claim }, { status: 200 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to update collections status.");
  }
}
