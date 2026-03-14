import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { createPayer } from "@/lib/services/lookups";
import { payerSchema } from "@/lib/validators/payer";

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = payerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payer payload." }, { status: 400 });
  }

  try {
    const payer = await createPayer(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: payer }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create payer." },
      { status: 500 }
    );
  }
}
