import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { createProvider } from "@/lib/services/lookups";
import { providerSchema } from "@/lib/validators/provider";

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = providerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider payload." }, { status: 400 });
  }

  try {
    const provider = await createProvider(
      context.supabase,
      context.profile,
      parsed.data
    );
    return NextResponse.json({ data: provider }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create provider." },
      { status: 500 }
    );
  }
}
