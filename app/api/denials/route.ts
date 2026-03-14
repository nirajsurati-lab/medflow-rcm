import { NextRequest, NextResponse } from "next/server";

import { getInternalRequestContext } from "@/lib/auth/context";
import { createDenial, listDenials } from "@/lib/services/denials";
import { denialSchema } from "@/lib/validators/denial";

export async function GET() {
  const context = await getInternalRequestContext();

  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const denials = await listDenials(context.supabase);
    return NextResponse.json({ data: denials }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load denials." },
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
  const parsed = denialSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid denial payload." }, { status: 400 });
  }

  try {
    const denial = await createDenial(context.supabase, context.profile, parsed.data);
    return NextResponse.json({ data: denial }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to log denial." },
      { status: 500 }
    );
  }
}
