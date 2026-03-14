import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { simulatePaymentStatus } from "@/lib/services/payments";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authContext = await getInternalRequestContext();

  if (!authContext.ok) {
    return NextResponse.json(
      { error: authContext.error },
      { status: authContext.status }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        status?: string;
      }
    | null;

  if (body?.status !== "paid" && body?.status !== "cancelled") {
    return NextResponse.json(
      { error: "Invalid payment simulation status." },
      { status: 400 }
    );
  }

  try {
    const { id } = await context.params;
    const payment = await simulatePaymentStatus(authContext.supabase, id, body.status);

    return NextResponse.json({ data: payment }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update payment status.",
      },
      { status: 500 }
    );
  }
}
