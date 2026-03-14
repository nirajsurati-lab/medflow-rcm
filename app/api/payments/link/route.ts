import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
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
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment link.",
      },
      { status: 500 }
    );
  }
}
