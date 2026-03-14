import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { apiErrorResponse, invalidPayloadResponse } from "@/lib/http/api-errors";
import { createCheckoutPaymentLink } from "@/lib/services/payments";
import { paymentLinkSchema } from "@/lib/validators/payment";

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = paymentLinkSchema.safeParse(body);

  if (!parsed.success) {
    return invalidPayloadResponse("Invalid payment payload.", parsed.error);
  }

  try {
    const origin = request.headers.get("origin") ?? request.nextUrl.origin;
    const result = await createCheckoutPaymentLink(context.supabase, context.profile, {
      ...parsed.data,
      origin,
    });

    return NextResponse.json(
      { data: result.payment, url: result.url },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error, "Unable to create payment link.");
  }
}
