import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { createClaim, listClaims } from "@/lib/services/claims";
import { claimSchema } from "@/lib/validators/claim";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const claims = await listClaims(context.supabase);
    return NextResponse.json({ data: claims }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load claims." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid claim payload." }, { status: 400 });
  }

  try {
    const claim = await createClaim(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: claim }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create claim." },
      { status: 500 }
    );
  }
}
